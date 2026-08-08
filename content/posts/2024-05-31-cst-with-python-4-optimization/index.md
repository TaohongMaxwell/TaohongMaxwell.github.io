---
date: 2024-05-31
draft: false
title: "CST_with_Python（四）：仿真优化"
categories:
  - EM Simulation
tags:
  - CST
  - Python
  - 仿真优化
  - 电磁仿真
  - scipy
  - 参数优化
summary: 本文是CST_with_Python系列第4篇，介绍如何使用Python的scipy.optimize模块控制CST Studio Suite进行自动化仿真优化。以T型波导为案例，通过优化函数与控制函数的配合，调整探针偏移量offset以降低S11反射系数，实现Python驱动的电磁仿真参数优化。
---
> 原文首发于我的微信公众号 **TaohongMaxwell**：[查看原文](https://mp.weixin.qq.com/s/IXfyEZNzgZRu3asDPr5l3w)

## 前言

在工程设计、求解计算的过程中，往往存在大量重复性的工作，这些工作不仅耗时耗力，而且容易出错。为了提高工作效率，减少人为错误，我们希望这些重复性工作能够被计算机自动完成，从而让工程师从繁重的重复性劳动中解放出来，将更多的精力投入到创造性的工作中。

CST Studio Suite® 提供了 Python 编程接口，也提供了在 Python 环境中执行 VB 脚本的接口。并且，在 CST Studio Suite 2024 中，CST Python Libraries 的特性得到了更新。

现在，我们将使用 Jupyter Notebook 连接到 CST Studio Suite，通过一个演示案例，使用 Python 优化模块对该模型进行优化。

文章共分为5个部分，分别介绍以下内容：

搭建 Python 环境

控制 CST 建模

仿真并绘制结果

仿真优化

外部后处理

本期为第 4 篇文章，详细介绍如何使用 Python 的优化模块控制 CST 进行自动优化。
## 零、为什么需要使用 Python

CST Studio Suite 已经拥有一套功能强大的优化器，这不禁让人思考： 在这样高速运转的机器面前，为何还需要借助 Python 的优化功能？

首先，我们必须承认，CST Studio Suite 的优化器已经能够解决大多数用户在电磁场仿真和优化方面的需求。然而，随着智能化时代的到来，我们面临的工程挑战也日益复杂。对于那些追求高度定制化优化策略的用户来说，单纯依赖 CST Studio Suite 的内置优化器可能无法满足他们的需求。

此外，随着人工智能（AI）技术的飞速发展，AI 能够处理的问题范围正在不断扩大。在许多情况下，AI 可以高效解决人工难以应对的复杂问题。而在 AI 领域，Python 无疑占据着主导地位。为了顺应这一趋势，将 CST Studio Suite 与 Python 结合使用，无疑是明智之举。

CST Studio Suite 提供了 Python 接口，这意味着用户可以将其与已有的优化程序和/或算法相结合，为有自动化需求的用户提供更加灵活的解决方案。同时，对于需要引入 AI 模型/技术来解决问题的用户，Python 接口为他们提供了极大的便利。

## 应用前景

综上所述，虽然 CST Studio Suite 的优化器已经非常强大，但通过与 Python 的结合，我们可以进一步拓展其应用范围，应对更加复杂的工程挑战。 这种协同进化的方式，不仅能够提升我们的工作效率，还能为复杂工程问题研究和计算领域带来更多的可能性。
## 一、准备工作

在此前的文章中，我们分享了搭建 Python 测试环境的流程，并完成了建模、求解器设置、仿真、结果绘制等工作。

现在，我们尝试使用 Python 命令定义相关的函数，并控制 CST 进行自动优化。

## 模型介绍

我们使用前面创建的 T 型波导进行演示。在 T 形波导结构中，中间的金属结构通常被称为"探针"，它的作用主要是将能量从主波导耦合到分支波导，或者从分支波导耦合到主波导。

改变探针的位置，能够改变波导内部的场分布。前面设置的 offset 参数的作用就是修改探针的位置。优化的过程即调整 offset 参数的过程，使得仿真结果符合我们的期望。

## 路径和参数设置

本案例基于此前的 Python 自动化案例，文件名为 CST_TEST.cst ，默认的路径为 C:\Users\<Users>\AppData\Local\Temp 。

在开始优化之前，需要加载所需的库，以及明确文件的路径。

为了避免访问冲突，让我们先关闭项目，并加载必要的库。

## 关闭项目和窗口

```python
#调用 CST Design Environment
project = cst.interface.DesignEnvironment()

#关闭项目和窗口
mws_project.close()
project.close()
```

## 安装必要的 Python 库

```python
import time
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import minimize
import tempfile
tmp = tempfile.gettempdir()
%matplotlib notebook
```

## 安装 CST Python 库

```python
import cst
import cst.interface
import cst.results
print(cst.__file__)
# should print
'<PATH_TO_CST_AMD64>\python_cst_libraries\cst\__init__.py'
```

## 二、Python函数

在这里，我们使用 Python 优化模块进行参数优化。优化的核心过程完全基于 Python，CST Studio Suite 的优化模块并未参与本次计算。

在整个优化的过程中，我们使用 优化函数 和 控制函数 两个函数，通过 优化函数 多次调用 控制函数 ，调整 offset 参数的值，尽可能降低 S11@9GHz ，从而达到优化的效果。

具体地，优化函数我们选用 scipy.optimize 库中的 minimize_scalar 函数，控制函数我们定义一个 runcst(x) 函数，这两个函数会在后面有详细介绍。

## 优化过程简介

为了便于理解，我们可以给本例中的各个相关的函数/模块分别取个昵称：

函数/模块 昵称称谓 主要职责 作用 优化函数 熊大函数 指挥 发起优化流程，判定求解结果是否符合优化期望，并传递新的 offset 参数值给控制函数。 控制函数 熊二函数 落实 传递 offset 参数值给 CST，并控制 CST 求解器进行运算控制，提取求解结果并返回给优化函数。 CST 求解器 幻兽帕鲁 干活 进行每一次 offset 参数值的模型求解运算，输出求解结果。

各个相关的函数/模块的运行过程可以参考下图：

优化函数（熊大） 身居高位，负责布置任务，以及判定仿真结果，并传递新的 offset 参数值（布置新的任务）。

控制函数（熊二） 承上启下，负责分配任务，控制一线的幻兽帕鲁 CST 求解器按照上级领导优化函数（熊大）布置的任务进行仿真，并从仿真结果中提取所需的数据 S11@9GHz ，返回给其上级领导优化函数（熊大）。

在优化的过程中，若熊大函数发现熊二函数计算输出的结果符合期望（例如达到优化目标/限定值等），则指挥熊二暂停给幻兽帕鲁分配计算任务， 落班！ 两人可以一边玩去了。

CST求解器（幻兽帕鲁） 仅负责对具体参数的求解。在示意图中我们能够清晰地看到，优化的核心过程完全基于 Python 环境中的熊大和熊二，CST Studio Suite 只有求解器参与了整个流程，并且只完成最后的数值计算工作。而 CST Studio Suite 的优化模块并未参与优化决策的过程。

让我们分别介绍 Python 环境下的这两个函数，先从 控制函数 开始。

## 控制函数（熊二函数）

在这里，我们先定义一个负责"干活"的控制函数，用来调整 offset 参数的值。

后续优化函数将会调用控制函数，并期望在优化中返回当前参数和结果值，完成整个优化过程。

具体而言， 控制函数（熊二） 负责分配来自上级函数（优化函数）的具体仿真任务，控制一线的幻兽帕鲁 CST 求解器按照上级领导优化函数（熊大）布置的任务进行仿真，并从仿真结果中提取所需的数据 S11@9GHz ，返回给其上级领导优化函数（熊大）。

## 定义控制函数

首先，让我们打开一个新的设计环境。

```python
project = cst.interface.DesignEnvironment()
```

随后，定义控制函数 runcst(x) ，参数 x 是金属探针的偏移量 offset 。

我们将尝试使用控制函数找到金探针的最佳位置，以尽量减少 9 GHz 时的反射。
```python
def runcst (x) :
try : # 确保输入的格式正确
y = float(x)
except ValueError: # 如果输入数据不能解释为浮点数，则输出错误提示
return nan
raise ValueError( "The expression entered in function runcst cannot be converted to a float..." )
else : # 如果输入成功，则继续执行
print( f'parameter value: {y} ' )
CST_file = project.open_project(tmp + r"\CST_TEST.cst" ) # 打开现有的CST项目
CST_file.model3d.StoreDoubleParameter( "offset" , y) # 将浮点数y存储为参数offset
CST_file.model3d.full_history_rebuild() # 加载到项目历史，使得参数生效
CST_file.model3d.run_solver() # 运行CST求解器
CST_file.save() # 保存项目文件并关闭
CST_file.close()
result_project = cst.results.ProjectFile(tmp + r"\CST_TEST.cst" ) # 打开结果
s11 = result_project.get_3d().get_result_item( r"1D Results\S-Parameters\S1,1" )
ss = np.asarray([s11.get_xdata() , s11.get_ydata()])
return np.absolute(ss[ 1 ][np.searchsorted(ss[ 0 ][:], 9 )]) # 提取9GHz处的Abs(S11)，并由函数返回
```

原则上，更有效的工作流程是保持项目一直打开，并简单更改参数值、更新历史列表（如使用 full_history_rebuild() ）和分析结果。

但出于演示目的（突出每一次优化流程），我们编写的控制函数在运行时，将多次打开和关闭项目。

因此，调用该函数时，除了第一次调用 Python 命令打开设计环境外，无需任何其他附加操作。

## 测试控制函数

为了测试控制函数，让我们使用新的 offset 参数值运行一次，运行完毕后，程序输出值是线性的 Abs(S11) 。

```python
runcst( 2.3456789 )
```

运行完毕后，可以再次更改 offset 参数，并进行多次测试。

```python
runcst( 1.14514 )
runcst( 2.33333 )
```

运行以下代码，可以查看当前参数值仿真结果的 dB(Abs(S11) 频率曲线。

```python
result_project = cst.results.ProjectFile(tmp + r"\CST_TEST.cst" )
s11_orig = result_project.get_3d().get_result_item( "1D Results\S-Parameters\S1,1" )
%matplotlib inline
plt.figure(figsize=( 9 , 5 ))
plt.plot(s11_orig.get_xdata(), 20 *np.log10(np.absolute(np.asarray(s11_orig.get_ydata()))))
plt.title( 'S-Parameter MAG ' )
plt.ylabel( 'Mag in dB' )
plt.xlabel( 'Freq. in GHz' )
plt.grid( True )
plt.ylim(( -40 , 0 ))
plt.xlim(( 8 , 10 ))
```

## 优化函数（熊大函数）

随后，我们介绍负责"指挥"的优化函数，用来配合控制函数进行优化。

优化函数（熊大） 身居高位，负责布置任务，以及判定仿真结果。如果当前结果不符合优化要求，那么优化函数将会传递新的 offset 参数值（即布置新的任务）。

在优化的过程中，若熊大函数发现熊二函数计算输出的结果符合期望（例如达到优化目标/限定值等），则指挥熊二暂停给幻兽帕鲁分配计算任务， 落班！！！ 两人可以一边玩去了。

对于这个简单的优化任务，我们使用 scipy.optimize 库中的 minimize_scalar 函数进行参数优化，配合上文的控制函数，将 S11@9GHz 尽可能降低。

## 优化函数简介

SciPy 是一个用于科学计算的开源 Python 库，其中的 scipy.optimize 模块专门用于优化算法和函数，包括无约束和有约束的优化问题，以及局部和全局优化算法。

模块中的 minimize_scalar 函数是一个用于寻找单变量无约束函数最小值的 Python 函数，其特性符合我们的需求：将某一频段内的 S11@9GHz 尽可能降低。

minimize_scalar 函数的基本用法非常简单，只需提供一个目标函数，然后该函数就会返回一个包含最优解的 OptimizeResult 对象，这个对象包含了最优解的值、目标函数在该点的值、优化是否成功完成的信息等。

## 优化函数参数介绍

进行优化时，需要提供优化函数的参数，以下是部分参数的说明：

runcst -优化对象的函数名，即前面定义的控制函数

method -优化算法，这里选择 bounded 法，以定义优化范围的边界

bounds -优化区间，这里填写我们要寻找的最佳 offset 值，即 (1.8,3.2) 这个区间

有关参数的进一步解释，可查阅 scipy.optimize 库的文档。

## 三、执行优化

确定好 优化函数（熊大） 和 控制函数（熊二） 后，我们即可开始使唤他们干活，完成参数优化的工作。

运行以下代码，即可开始优化：

```python
from scipy.optimize import minimize_scalar
from scipy.optimize import Bounds

res = minimize_scalar(runcst, method= 'bounded' , bounds=( 1.8 , 3.2 ),options={ 'xatol' : 1e-02 , 'maxiter' : 15 , 'disp' : 3 })
```

程序运行后， 优化函数 会多次调用 控制函数 ，从而控制 CST Studio Suite 求解器求解计算。类比 熊大 使唤 熊二 干活， 熊二 使唤 帕鲁 干活……

优化算法运行时，会调用 CST Studio Suite 多次打开项目求解，并返回每次求解的 offset 和 S11@9GHz 的值。

需要注意的是，优化的核心过程完全基于 Python，CST 的优化模块并未参与本次计算。

## 四、查阅结果

优化结束后，可以查阅优化后的结果，以检查 熊大 和 熊二 的工作质量：

```python
result_project = cst.results.ProjectFile(tmp + r"\CST_TEST.cst" )
s11 = result_project.get_3d().get_result_item( "1D Results\S-Parameters\S1,1" )
%matplotlib inline
plt.figure(figsize=( 9 , 5 ))
plt.plot(s11.get_xdata(), 20 *np.log10(np.absolute(np.asarray(s11.get_ydata()))),label= 'Optimized' )
plt.plot(s11_orig.get_xdata(), 20 *np.log10(np.absolute(np.asarray(s11_orig.get_ydata()))),label= 'Original' )
plt.title( 'S-Parameter MAG ' )
plt.ylabel( 'Mag in dB' )
plt.xlabel( 'Freq. in GHz' )
plt.legend(loc= 'lower right' )
plt.grid( True )
plt.ylim(( -45 , -10 ))
plt.xlim(( 8 , 10 ))
```

从结果可以看到，经过本次简单优化后，模型的 S 参数有所改善，反射系数 S11 已经低于 -30dB。

通过以上示例，可以看到简单的优化目标的优化效果。

虽然 CST Studio Suite 的优化器已经非常强大，但通过与 Python 的结合，我们可以进一步拓展其应用范围，应对更加复杂的工程挑战。如需定制更加复杂的优化目标，可以根据工程需要修改对应的控制函数，或者使用更加适合的优化函数，也可以专门编写对应的优化程序。
## 总结

将 CST Studio Suite 与 Python 结合使用，不仅能够应对复杂工程问题，而且能引入 AI 参与到优化工作中。

在整个计算过程中，使用 优化函数 多次调用 控制函数 ，从而达到优化 offset 参数的效果。

本案例为了演示，在脚本中控制打开和关闭项目，并输出运行结果，但更有效的工作流程是：保持项目打开，并简单更改参数值、更新历史列表（如使用 full_history_rebuild() ）和分析结果。

优化的核心过程完全基于 Python，CST Studio Suite 的优化模块并未参与本次计算。
