---
date: 2024-05-24
draft: false
title: "CST_with_Python（二）：控制 CST 建模"
categories:
  - EM Simulation
tags:
  - CST
  - Python
  - 仿真建模
  - 自动化
  - CST_Python_Libraries
  - Jupyter
summary: "本文是CST与Python自动化系列的第二篇文章，详细介绍如何使用Jupyter Notebook连接CST Studio Suite，通过Python脚本控制CST创建电磁仿真模型，涵盖调用CST、创建项目、建立模型、设置参数等完整流程。"
---
> 原文首发于我的微信公众号 **TaohongMaxwell**：[查看原文](https://mp.weixin.qq.com/s/ZC-kygjtYpESvqghiPLRDA)

## 前言

在工程设计、求解计算的过程中，往往存在大量重复性的工作，这些工作不仅耗时耗力，而且容易出错。为了提高工作效率，减少人为错误，我们希望这些重复性工作能够被计算机自动完成，从而让工程师从繁重的重复性劳动中解放出来，将更多的精力投入到创造性的工作中。

CST Studio Suite® 提供了 Python 编程接口，也提供了在 Python 环境中执行 VB 脚本的接口。并且，在 CST Studio Suite 2024 中，CST Python Libraries 的特性得到了更新。

现在，我们将使用 Jupyter Notebook 连接到 CST Studio Suite，通过一个演示案例，完成脚本控制建立模型、查看结果等工作，并在 Python 中进行更多自动化任务。

文章共分为5个部分，分别介绍以下内容：

搭建 Python 环境

控制 CST 建模

仿真并绘制结果

仿真优化

外部后处理

本期为第 2 篇文章，详细介绍如何使用 Python 控制 CST 创建仿真模型。

## 准备工作

在 上一篇文章 中，我们分享了如何搭建 Python 测试环境的流程。本次案例基于上一篇文章的模型操作。

如果您保留了上次搭建环境时候的 Jupyter Notebook 工程和 CST 工程，可以在关联文件后基于该模型继续操作。

如果您未保留上一次的 CST 工程，可以按照以下步骤操作：

## 打开测试案例并检查对应的库

在 cmd 中输入以下内容（注意全是小写）即可进入控制台。

```bash
jupyter notebook
```

打开测试案例，运行有以下代码，加载必要的库。如果有报错提示缺少库，使用 pip 安装缺少的库，直到无报错出现。

```python
import time
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import minimize
import tempfile

tmp = tempfile.gettempdir()
%matplotlib notebook
```

运行下面的代码，加载 CST Python 库。

```python
# cst related imports
import cst
import cst.interface
import cst.results

print(cst.__file__)
# should print '<PATH_TO_CST_AMD64>\python_cst_libraries\cst\__init__.py'
```

如果成功执行该命令，该单元格的输出将打印库的路径。

## 调用 CST 并创建项目

现在，让我们调用 CST Design Environment，开始初始化连接。

```python
project = cst.interface.DesignEnvironment()
```

执行该代码，打开 CST Design Environment，会出现提示“静态/脚本模式已激活，弹出窗口已被阻止”弹窗，点击“Swich to Interactive Mode”切换到交互模式即可。

运行下面的代码，创建一个空的 CST Microwave Studio 项目。

```python
mws_project = project.new_mws()
```

运行下面的代码，激活当前项目的窗口。

```python
mws_project.activate()
```

将项目保存在当前用户的 TEMP 文件夹中，即 C:\Users\<Users>\AppData\Local\Temp 路径。

```python
mws_project.save(tmp+ "\CST_TEST.cst" )
```

如果提示“文件已存在”，说明此前已经保存过该文件到该目录，没有赋予文件操作相关的命令，无法覆盖保存。

可以修改拟保存的项目名称，也可以在文件管理器中访问该路径删除原有文件。

此外，用户也可以根据自己的需求，将项目文件保存到指定的位置。

## 创建 offset 参数

在模型中创建一个名为 offset 的参数。

```python
mws_project.model3d.StoreDoubleParameter( "offset" , 3 )
```

请检查该参数在项目参数列表中是否可见。

## 建模

CST 支持 Python 与 VBA，并通过在 Python 调用封装的 VBA 命令，以获得完整的脚本功能。

在这里，我们先使用 VBA 定义模型，随后使用 Python 命令 add_to_history 将之前定义的建模命令添加到 History List 中，以完成建模操作。

## 模型介绍

选用一个 T 型波导进行建模演示。在 T 形波导结构中，中间的金属结构通常被称为“探针”，它的作用主要是将能量从主波导耦合到分支波导，或者从分支波导耦合到主波导。

改变探针的位置，能够改变波导内部的场分布。前面设置的 offset 参数的作用就是修改探针的位置。这个参数在建模和优化的过程中会用到。

我们尝试使用命令来进行建模操作。

## 使用 VBA 定义命令

在该操作的中间步骤中，并非所有的 VBA 命令都有对应的本地 Python 命令。

不过，为了保证操作的连续性，通过在 Python 中调用封装的 VBA 命令，仍然可以获得完整的脚本功能控制 CST。

接下来将通过 VBA 代码来定义一些命令。

## 设置求解器参数

设置仿真频率为 8-10 GHz，并设置一个 9GHz 场监视器，求解器选用 T 求解器。

```python
Full_History = """
'Set Freq
Solver.FrequencyRange 8, 10
"""

Full_History = Full_History + """
'Define Monitor
With Monitor
.Reset
.Name "e-field (f=9)"
.Dimension "Volume"
.Domain "Frequency"
.FieldType "Efield"
.Frequency 9
.Create
End With
"""

Full_History = Full_History + """
'Define Solver
ChangeSolverType "HF Time Domain"
With Solver
.CalculationType "TD-S"
.StimulationPort "1"
.StimulationMode "1"
.MeshAdaption False
.CalculateModesOnly False
.SParaSymmetry False
.StoreTDResultsInCache False
.FullDeembedding False
.UseDistributedComputing False
End With
"""
```

## 创建 T 型波导模型

```python
Full_History = Full_History + """
'Define Units
With Units
.Geometry "mm"
.Frequency "ghz"
.Time "ns"
End With

'  set workplane properties

With WCS
.SetWorkplaneSize "50"
.SetWorkplaneRaster "10"
.SetWorkplaneSnap "TRUE"
.SetWorkplaneSnapRaster "5"
End With

'  new component: component1
Component.New "component1"

'  define brick: component1:solid1
With Brick
.Reset
.Name "solid1"
.Component "component1"
.Material "Vacuum"
.Xrange "-10", "10"
.Yrange "0", "10"
.Zrange "0", "40"
.Create
End With

'  pick face
Pick.PickFaceFromId "component1:solid1", "6"

'  align wcs with face
WCS.AlignWCSWithSelectedFace
Pick.PickCenterpointFromId "component1:solid1", "6"
WCS.AlignWCSWithSelectedPoint

'  define brick: component1:solid2
With Brick
.Reset
.Name "solid2"
.Component "component1"
.Material "Vacuum"
.Xrange "-5", "5"
.Yrange "-10", "10"
.Zrange "0", "20"
.Create
End With

'  pick face
Pick.PickFaceFromId "component1:solid2", "1"

'  define port: 1
With Port
.Reset
.PortNumber "1"
.NumberOfModes "1"
.AdjustPolarization False
.PolarizationAngle "0.0"
.ReferencePlaneDistance "0"
.TextSize "50"
.Coordinates "Picks"
.Orientation "xmax"
.PortOnBound "True"
.ClipPickedPortToBound "False"
.Xrange "30", "30"
.Yrange "0", "10"
.Zrange "10", "30"
.Create
End With

'  pick face
Pick.PickFaceFromId "component1:solid1", "1"

'  define port: 2
With Port
.Reset
.PortNumber "2"
.NumberOfModes "1"
.AdjustPolarization False
.PolarizationAngle "0.0"
.ReferencePlaneDistance "0"
.TextSize "50"
.Coordinates "Picks"
.Orientation "zmax"
.PortOnBound "True"
.ClipPickedPortToBound "False"
.Xrange "-10", "10"
.Yrange "0", "10"
.Zrange "40", "40"
.Create
End With

'  pick face
Pick.PickFaceFromId "component1:solid1", "2"

'  define port: 3
With Port
.Reset
.PortNumber "3"
.NumberOfModes "1"
.AdjustPolarization False
.PolarizationAngle "0.0"
.ReferencePlaneDistance "0"
.TextSize "50"
.Coordinates "Picks"
.Orientation "zmin"
.PortOnBound "True"
.ClipPickedPortToBound "False"
.Xrange "-10", "10"
.Yrange "0", "10"
.Zrange "0", "0"
.Create
End With

'  define boundaries
With Boundary
.Xmin "electric"
.Xmax "electric"
.Ymin "electric"
.Ymax "electric"
.Zmin "electric"
.Zmax "electric"
.Xsymmetry "none"
.Ysymmetry "electric"
.Zsymmetry "none"
End With

'  define background
With Background
.ResetBackground
.XminSpace "0.0"
.XmaxSpace "0.0"
.YminSpace "0.0"
.YmaxSpace "0.0"
.ZminSpace "0.0"
.ZmaxSpace "0.0"
.ApplyInAllDirections "False"
End With

With Material
.Reset
.FrqType "all"
.Type "Pec"
.MaterialUnit "Frequency", "Hz"
.MaterialUnit "Geometry", "m"
.MaterialUnit "Time", "s"
.MaterialUnit "Temperature", "Kelvin"
.Epsilon "1.0"
.Mu "1.0"
.ReferenceCoordSystem "Global"
.CoordSystemType "Cartesian"
.NLAnisotropy "False"
.NLAStackingFactor "1"
.NLADirectionX "1"
.NLADirectionY "0"
.NLADirectionZ "0"
.Rho "0.0"
.ThermalType "Normal"
.ThermalConductivity "0.0"
.SpecificHeat "0.0", "J/K/kg"
.MetabolicRate "0"
.BloodFlow "0"
.VoxelConvection "0"
.MechanicsType "Unused"
.Colour "0.6", "0.6", "0.6"
.Wireframe "False"
.Reflection "False"
.Allowoutline "True"
.Transparentoutline "False"
.Transparency "0"
.ChangeBackgroundMaterial
End With

'  activate global coordinates
WCS.ActivateWCS "global"

'  boolean add shapes: component1:solid1, component1:solid2
Solid.Add "component1:solid1", "component1:solid2"

'  pick face
Pick.PickFaceFromId "component1:solid1", "11"

'  align wcs with face
WCS.AlignWCSWithSelectedFace
Pick.PickCenterpointFromId "component1:solid1", "11"
WCS.AlignWCSWithSelectedPoint

'  store picked point: 1
Pick.NextPickToDatabase "1"
Pick.PickEndpointFromId "component1:solid1", "9"

'  define cylinder: component1:solid2
With Cylinder
.Reset
.Name "solid2"
.Component "component1"
.Material "PEC"
.OuterRadius "1"
.InnerRadius "0"
.Axis "z"
.Zrange "zp(1)", "0"
.Xcenter "-10+offset"
.Ycenter "0"
.Segments "0"
.Create
End With

'  activate global coordinates
WCS.ActivateWCS "global"
"""
```

## 将建模命令添加到 History List

随后，我们向 CST 发送建模命令。

注意，这次我们使用的是 Python 命令 add_to_history 。这将执行我们之前定义的命令字符串，并将这些命令添加到 History List 中。

```python
mws_project.model3d.add_to_history ( "My_Splitter" , Full_History)
```

检查几何体是否在界面中可见，并检查求解器和频率设置。

至此，已经完成建模、设置场监视器和求解器的步骤。

## 总结

CST 支持 Python 与 VBA，并通过在 Python 调用封装的 VBA 命令，获得完整的脚本功能。

先使用 VBA 定义模型，随后使用 Python 命令 add_to_history 将之前定义的建模等命令添加到 History List 中，以完成建模操作。
