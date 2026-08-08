---
date: 2024-06-13
draft: false
title: "CST_with_Python（五）：外部后处理"
categories:
  - EM Simulation
tags:
  - CST
  - Python
  - HDF5
  - 后处理
  - 仿真
  - 电磁场
summary: 本文是CST_with_Python系列第5篇，介绍使用Python对CST仿真结果进行外部后处理。内容涵盖将仿真结果导出为HDF5文件、使用h5py读取电场数据、numpy计算场强、matplotlib可视化二维切面，实现CST与Python的协同数据处理。
---
> 原文首发于我的微信公众号 **TaohongMaxwell**：[查看原文](https://mp.weixin.qq.com/s/3qqkkRM5JS5FWR6KoFF-GQ)

## 前言

在工程设计、求解计算的过程中，往往存在大量重复性的工作，这些工作不仅耗时耗力，而且容易出错。为了提高工作效率，减少人为错误，我们希望这些重复性工作能够被计算机自动完成，从而让工程师从繁重的重复性劳动中解放出来，将更多的精力投入到创造性的工作中。

CST Studio Suite® 提供了 Python 编程接口，也提供了在 Python 环境中执行 VB 脚本的接口。并且，在 CST Studio Suite 2024 中，CST Python Libraries 的特性得到了更新。

CST Studio Suite 支持将仿真得到的数据导出为 HDF5 格式文件（ .h5 ），方便在 Python 中进行更深入的数据分析和后处理。通过 Python 的科学计算库（如 h5py 、 numpy 和 matplotlib 等），用户可以高效地处理和可视化这些数据，从而更好地理解和优化仿真结果。我们将通过一个演示案例，将仿真结果导出为 HDF5 格式文件，并使用 Python 进一步处理结果。

文章共分为5个部分，分别介绍以下内容：

搭建 Python 环境

控制 CST 建模

仿真并绘制结果

仿真优化

外部后处理

本期为第 5 篇文章，详细介绍如何使用 Python 对 CST Studio Suite 仿真结果进行进一步处理。

## 零、为什么需要使用 Python

CST Studio Suite 已经足够强大，能够胜任绝大多数复杂系统的设计和仿真工作。然而，随着智能化时代的到来，我们面临的工程挑战也日益复杂。

在 上一篇文章 中，我们介绍了 CST Studio Suite 提供的 Python 接口，为用户将已有的优化程序算法相结合提供了足够的便利，同时也为 AI 技术的引入进行了赋能。

今天我们继续拓展该话题，介绍使用 Python 对 CST Studio Suite 的仿真结果进行外部后处理。通过与 Python 的结合，我们可以进一步拓展 CST Studio Suite 的应用范围，以应对更加复杂的工程挑战。

## 一、准备工作

在此前的文章中，我们分享了搭建 Python 测试环境的流程，并完成了建模、求解器设置、仿真、结果绘制、仿真优化等工作。

现在，我们使用前面创建的 T 型波导进行演示。尝试将仿真结果导出为 HDF5 格式文件，并使用 Python 进一步处理结果。

要实现使用 Python 进行外部后处理，整体的工作流程为：

打开仿真结果，手动或通过脚本将仿真结果导出为 HDF5 文件（即本节内容）

使用 Python 脚本处理数据（即第二节内容）

展示结果（即第三节内容）

而本节的工作就是运行仿真，得到仿真结果，并将仿真结果导出为 HDF5 格式文件。

## 运行仿真

打开 CST Studio Suite，加载测试项目，并运行仿真，等待仿真结束。

## 软件内运行后处理

考虑将场监视器 e-field(f=9) 的结果数据导出为 HDF5 文件，这一步可以使用相应的后处理模板，操作路径为：

在导航树中选中 2D/3DResult > E-field > e-field(f=9)[1] 结果

点击 Post-Processing 选项卡，点击 Tools > Result Templates

在弹窗中分别选择 2D and 3D Field Results > - Export 3D Field Result

在另一个弹窗中点击 Browse Result，确保选中目标频率的结果（即 E-field > e-field(f=9)[1] ）

根据需要设置采样步长 Step-size（本例设置步长为 1，以获得更好的分辨率）

确保文件类型选中 HDF5

点击 OK

点击 OK 之后，选中该后处理任务，然后点击 Evaluate，即可开始导出文件。

也可以通过 Python 界面直接导出文件，代码如下：

```python
ascii_export = prj_3d.ASCIIExport
prj_3d.SelectTreeItem( r"2D/3D Results\E-Field\e-field (f=9) [1]" )

ascii_export.Reset()
ascii_export.SetfileType ( "hdf5" )
ascii_export.FileName(tmp + r"\e-field (f=9) [1].h5" )
ascii_export.Mode( "FixedWidth" )
ascii_export.Step( 1 )
ascii_export.Execute()
```

导出文件后，文件的路径可以在信息栏中查看。

## 保存并关闭CST

生成结果文件后，后续的结果解读和数据处理可以不依赖于 CST Studio Suite 了，即使关闭了 CST Studio Suite，也不影响后续操作。

至此，我们已经完成结果数据的导出，可以保存工程文件并关闭 CST Studio Suite。

## 二、编写结果处理脚本

得到仿真结果和导出的 HDF5 文件后，我们开始考虑使用 Python 脚本处理数据。可以根据工程需要，自由编写数据处理脚本。

本例所示的脚本代码，读取刚才导出的包含了电场（E-Field）数据的 HDF5 文件，计算 0 和 90 度相位的场强分布，进行简单的数据处理。

## 读取 HDF5 文件

## 导入必要的库并打开文件

```python
import h5py
import numpy as np
import tempfile
import matplotlib.pyplot as plt

tmp = tempfile.gettempdir()
file_name = tmp + r"\e-field (f=9) [1].h5"

f = h5py.File(file_name, 'r' )
```

## 查看文件结构

列出文件中的所有数据集，以帮助了解文件的结构。

```python
list(f.keys())
```

## 简单数据处理

了解了文件的数据结构之后，我们对该数据做一些微小的处理工作……

## 创建数组

为了进一步处理和绘图，我们先获取网格线数据， meshX 、 meshY 、 meshZ 分别存储了 X、Y、Z 方向上网格线的位置信息。

```python
dset = f[ 'E-Field' ]
meshX = np.asarray(f[ 'Mesh line x' ])
meshY = np.asarray(f[ 'Mesh line y' ])
meshZ = np.asarray(f[ 'Mesh line z' ])
```

## 分析电场数据

接下来，让我们进一步了解一下电场数据的结构。

```python
dset.dtype
```

获取电场在 X、Y、Z 方向上的实部和虚部数据，并组合成复数形式： Ex 、 Ey 、 Ez 。

```python
Ex = (dset[ 'x' ][ 're' ]+ 1j *dset[ 'x' ][ 'im' ])
Ey = (dset[ 'y' ][ 're' ]+ 1j *dset[ 'y' ][ 'im' ])
Ez = (dset[ 'z' ][ 're' ]+ 1j *dset[ 'z' ][ 'im' ])
```

## 计算0和90度相位结果

分别计算 0 和 90 度相位的场强绝对值。

```python
E_0_abs = np.sqrt(Ex[:, 11 ,:].real** 2 + Ey[:, 11 ,:].real** 2 + Ez[:, 11 ,:].real** 2 )
E_90_abs = np.sqrt((Ex[:, 11 ,:]* 1j ).real** 2 + (Ey[:, 11 ,:]* 1j ).real** 2 + (Ez[:, 11 ,:]* 1j ).real** 2 )
```

至此，我们完成了对电场（E-Field）数据的简单处理。

## 三、结果展示

最后，我们使用 matplotlib 函数进行绘图，分别绘制相位为 0 度和 90 度电场的二维切面。

```python
title_0 = f"View of absolute field values for phase zero at y = {meshY[ 11 ]: .3 f} "
title_90 = f"View of absolute field values for phase 90 at y = {meshY[ 11 ]: .3 f} "
```

```python
%matplotlib inline
plt.figure(figsize=( 8 , 7 ))
plt.imshow(E_0_abs, extent=[meshX[ 0 ], meshX[ -1 ], meshZ[ 0 ], meshZ[ -1 ]], origin= 'lower' ,
cmap= 'jet' , aspect= 'equal' , interpolation= "bicubic" )
plt.colorbar()
plt.title(title_0)

plt.figure(figsize=( 8 , 7 ))
plt.imshow(E_90_abs, extent=[meshX[ 0 ], meshX[ -1 ], meshZ[ 0 ], meshZ[ -1 ]], origin= 'lower' ,
cmap= 'jet' , aspect= 'equal' , interpolation= "bicubic" )
plt.colorbar()
plt.title(title_90)
```

这里展示的是一个简单的利用 Python 进行外部后处理的结果，用户可以根据实际工程需要，以自定义的方式编写脚本，使得 Python 与 CST Studio Suite 有机地结合起来，促进仿真和设计持续迭代。这种协同进化的方式，不仅能够提升我们的工作效率，还能为复杂工程问题研究和计算领域带来更多的可能性。

## 总结

在导出数据的过程中设置适当的 Step-size。

读取 HDF5 文件时，可以根据需要使用相对路径或绝对路径。

用户可以根据实际工程需要，以自定义的方式编写脚本。
