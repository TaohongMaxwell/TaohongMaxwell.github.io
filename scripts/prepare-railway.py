#!/usr/bin/env python3
"""
铁路路径预计算脚本

从 OSM 下载中国铁路网络，为 data/tickets.yaml 中的火车票计算
实际铁路路径坐标，并将结果写回 YAML 的 route 字段。

依赖：pip install osmnx pyyaml
首次运行需下载中国铁路网络（约 20-30MB），后续仅计算新增路线。

用法：
  python scripts/prepare-railway.py [--force]
    --force  强制重新计算所有火车票路线（默认只计算 route 为空的条目）
"""

import argparse
import sys
from pathlib import Path

import yaml

DATA_FILE = Path(__file__).parent.parent / "data" / "tickets.yaml"


def load_tickets() -> dict:
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def save_tickets(data: dict) -> None:
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        yaml.dump(data, f, allow_unicode=True, default_flow_style=False, sort_keys=False, width=120)
    print(f"✓ 已写回 {DATA_FILE}")


def build_railway_graph(bbox: dict | None = None):
    """
    从 OSM 下载铁路网络并构建 NetworkX 有向图。
    默认下载中国范围，可指定 bbox 缩小范围。
    """
    import osmnx as ox

    ox.settings.log_console = True
    ox.settings.use_cache = True
    ox.settings.overpass_endpoint = "https://overpass.kumi.systems/api/interpreter"
    ox.settings.overpass_rate_limit = False

    if bbox is None:
        # 中国大致范围 (left, bottom, right, top)
        bbox = (73.0, 18.0, 135.0, 54.0)

    print(f"正在下载铁路网络 (bbox={bbox}) ...")
    # 下载 railway=rail 的边（主干铁路）
    G = ox.graph_from_bbox(
        bbox=bbox,
        custom_filter='["railway"="rail"]["service"!="spur"]["service"!="yard"]["service"!="siding"]',
        simplify=False,
        retain_all=False,
    )

    print(f"正在简化铁路网络图 ...")
    G = ox.simplify_graph(G)

    print(f"铁路网络：{len(G.nodes)} 个节点, {len(G.edges)} 条边")
    return G


def find_rail_route(G, from_lat: float, from_lng: float, to_lat: float, to_lng: float) -> list | None:
    """
    在铁路网络图中找到从起点到终点的最短路径。
    返回坐标点列表 [[lat, lng], ...] 或 None。
    """
    import osmnx as ox

    try:
        # 找到最近的网络节点
        orig_node = ox.nearest_nodes(G, from_lng, from_lat)
        dest_node = ox.nearest_nodes(G, to_lng, to_lat)

        # 最短路径（按长度加权）
        route = ox.shortest_path(G, orig_node, dest_node, weight="length")

        if route is None:
            print(f"  ⚠ 未找到从 ({from_lat},{from_lng}) 到 ({to_lat},{to_lng}) 的路径")
            return None

        # 提取路径坐标
        coords = []
        for node_id in route:
            node = G.nodes[node_id]
            coords.append([node["y"], node["x"]])

        return coords

    except Exception as e:
        print(f"  ✗ 路径查找失败: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="预计算铁路路径")
    parser.add_argument("--force", action="store_true", help="强制重新计算所有火车票路线")
    args = parser.parse_args()

    data = load_tickets()
    tickets = data.get("tickets", [])
    train_tickets = [t for t in tickets if t.get("type") == "train"]

    to_process = []
    for t in train_tickets:
        if args.force or not t.get("route") or len(t.get("route", [])) < 2:
            to_process.append(t)

    if not to_process:
        print("✓ 所有火车票路线已就绪，无需更新。")
        return

    print(f"需要计算 {len(to_process)} 条铁路路径")

    updated = 0
    for t in to_process:
        print(f"  → {t['departure']['city']} → {t['arrival']['city']} ({t['number']})")

        # 为每条路线单独计算 bbox（扩大 2 度）
        margin = 2.0
        lats = [t["departure"]["lat"], t["arrival"]["lat"]]
        lngs = [t["departure"]["lng"], t["arrival"]["lng"]]
        bbox = (
            min(lngs) - margin, min(lats) - margin,
            max(lngs) + margin, max(lats) + margin,
        )

        try:
            G = build_railway_graph(bbox)
        except ImportError:
            print("请先安装依赖：pip install osmnx pyyaml")
            sys.exit(1)
        except Exception as e:
            print(f"  ⚠ 下载铁路网络失败: {e}")
            continue

        coords = find_rail_route(
            G,
            t["departure"]["lat"], t["departure"]["lng"],
            t["arrival"]["lat"], t["arrival"]["lng"],
        )
        if coords:
            t["route"] = coords
            updated += 1

    print(f"\n✓ 成功计算 {updated}/{len(to_process)} 条路径")

    if updated > 0:
        save_tickets(data)
    else:
        print("  无路径更新，文件未修改。")


if __name__ == "__main__":
    main()
