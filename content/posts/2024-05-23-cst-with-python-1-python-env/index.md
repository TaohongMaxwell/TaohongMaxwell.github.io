---
date: 2024-05-23
draft: false
title: "CST_with_Python（一）：搭建 Python 环境"
categories:
  - EM Simulation
tags:
  - CST
  - Python
  - 仿真
  - 脚本自动化
  - 环境搭建
  - Jupyter
summary: 本文为「CST_with_Python」系列第一篇技术教程，系统介绍如何搭建 Python 环境以通过脚本自动化控制 CST Studio Suite。内容包括 Python 版本选择与安装、环境变量配置、Jupyter Notebook 部署、以及验证 CST Python 库接口是否正常连接，为后续建模、仿真优化和外部后处理打下基础。
---
> 原文首发于我的微信公众号 **TaohongMaxwell**：[查看原文](https://mp.weixin.qq.com/s/uN_6Rx4CqwSjw43GQ18hQw)

## 背景

在工程设计、求解计算的过程中，往往存在大量重复性的工作，这些工作不仅耗时耗力，而且容易出错。为了提高工作效率，减少人为错误，我们希望这些重复性工作能够被计算机自动完成，从而让工程师从繁重的重复性劳动中解放出来，将更多的精力投入到创造性的工作中。

脚本是一种常用的自动化形式，它通过编写一系列的指令，让计算机或程序按照既定的顺序执行这些指令，从而完成一系列的自动化操作。

Python 是一种广泛使用的脚本语言。Jupyter Notebook 是基于网页的用于交互计算的应用程序，可以以网页的形式打开 Python 项目，在网页中直接编写运行脚本。

CST Studio Suite® 提供了 Python 编程接口，也提供了在 Python 环境中执行 VB 脚本的接口。并且，在 CST Studio Suite 2024 中，CST Python Libraries 的特性得到了更新。 通过脚本控制 CST Studio Suite，工程师可以将这些重复性的工作交给计算机自动完成，例如编写相应的算法让计算机自动寻找最优解，从而大大提高求解计算的效率。

现在，我们将使用 Jupyter Notebook 连接到 CST Studio Suite，通过一个演示案例，完成脚本控制建立模型、查看结果等工作，并在 Python 中进行更多自动化任务。

## 内容介绍

文章共分为5个部分，分别介绍以下内容：

搭建 Python 环境

控制 CST 建模

仿真并绘制结果

仿真优化

外部后处理

本期为第 1 篇文章，详细介绍如何搭建 Python 测试环境。

安装 Python

Python 版本选择

Python 生命周期与 CST 兼容性

安装来源

设置环境变量

验证 Python 是否成功安装

安装 Jupyter

设置下载源

安装 Jupyter

验证 Jupyter Notebook 能否顺利启动

启动 Jupyter Notebook

加载测试文件

在 Jupyter 中运行 Python

安装必要的库

检查 CST 相关库和接口是否正确

调用 CST Design Environment

创建空项目

查询求解器

创建参数

测试环境

## 安装 Python

## Python 版本选择

在 CST Studio Suite 2024 帮助页面中标明，支持的版本为 Python 3.6-3.11 版本。

在开始测试之前，可以检查计算机是否已安装符合要求的 Python，例如在已安装应用列表中查阅，如未找到则需要手动安装 Python。

## Python 生命周期与 CST 兼容性

根据 Python Developer’s Guide 的信息（https://devguide.python.org/versions/#branchstatus），目前的发行的 Python 版本，状态为 security 的有 3.8-3.11 。

其中，在尝试使用 3.11 版部署环境时，安装上述 cst-studio-suite-link 包的时候，有一定概率会提示错误，错误信息表明 cst-studio-suite-link 包要求的 Python 版本是小于 3.11。

因此，可以根据自身情况安装 3.10 或 3.9， 这里以 3.10 版本为例。

## 安装来源

Python 的来源可以为 Python 官网和 Microsoft Store，可以根据自身情况选择安装途径。

如果选择从 Python 官网下载安装：

访问 Python 官网（https://www.Python.org/downloads/）下载并安装 Python。

安装过程中，确保选择了 Add Python to PATH 选项，以便在命令行中直接运行 Python。

根据安装程序的指引完成安装过程。

如果选择从 Microsoft Store下载安装：

打开 Microsoft Store，搜索"Python 3.10"，选择 安装 或 下载 。

Windows 系统会自动在后台下载并安装。

手动设置环境变量（后面会详细介绍）。

## 设置环境变量

如果使用 Python 官网下载的安装包安装，并勾选了 Add Python to PATH 选项，则可以忽略该步骤。

在 Windows 系统中，按照以下步骤操作：

右键点击"此电脑"或"我的电脑"，选择"属性"。

点击"高级系统设置"。

在"系统属性"窗口中，点击"环境变量"按钮。

在"系统变量"区域，找到并选择"Path"变量，然后点击"编辑"。

点击"新建"，然后添加以下内容：

C:\Users\<username>\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.10_qbz5n2kfra8p0\LocalCache\local-packages\Python310\Scripts

其中， <username> 表示当前用户名。

点击"确定"保存更改，并继续点击"确定"关闭所有打开的窗口。

可能需要重新打开 cmd 或者重新启动计算机，以使更改生效。

## 验证 Python 是否成功安装

打开 cmd，在命令行中输入 python ，若返回以下信息，则代表 Python 已经成功安装。

```text
Python 3.10 .xx ...
Type "help" , "copyright" , "credits" or "license" for more information.
```

## 安装 Jupyter

成功安装 Python 后，进一步部署 Jupyter。

## 设置下载源

安装 Jupyter Notebook 之前，为了提升下载安装的体验，建议先手动设置国内的下载源。

我们推荐将下载源设置为清华大学，以管理员身份打开 cmd，输入对应指令

```bash
python -m pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --upgrade pip #升级pip
pip config set global .index-url https://pypi.tuna.tsinghua.edu.cn/simple #将该地址设为默认下载源
```

具体信息可以参考https://mirrors.tuna.tsinghua.edu.cn/help/pypi/。

## 安装 Jupyter

```bash
pip install jupyter
```

通常而言，默认下载源的下载速率约为 20kB/s，如果下载速率太慢，或者无法全局设置国内的源，可以在下载时临时使用清华的源。代码如下：

```bash
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple jupyter
```

这时候会进入下载与安装界面，从命令行窗口返回的信息中可以看到，下载速率可达到 10+MB/s。

## 验证 Jupyter Notebook 能否顺利启动

在 cmd 中输入以下内容（注意全是小写）

```bash
jupyter notebook
```

若一切顺利，会出现以下反馈：

cmd 窗口中显示启动过程，并提示相关信息。

默认浏览器会打开，并出现 Jupyter Notebook 控制台。

如果出现了问题，可参考以下解决方案：

| 问题 | 原因 | 解决方案 |
| --- | --- | --- |
| cmd 窗口提示警告，存在环境变量相关内容 | 安装的某些脚本（例如 qtpy.exe 和 jupyter-console.exe ）被放置在了系统PATH环境变量之外的目录中。 | 添加目录到环境变量中，或者使用完整的路径运行脚本。 |
| cmd 窗口未报错，但浏览器窗口提示提示 ERR_FILE_NOT_FOUND（未找到文件它可能已被移动、编辑或删除） | 添加环境变量后未重启Jupyter服务 | 关闭浏览器窗口与命令行窗口，尝试重启 Jupyter 服务。如无效则尝试重启计算机。 |

## 准备工作

## 启动 Jupyter Notebook

在 cmd 中输入以下内容（注意全是小写）

```bash
jupyter notebook
```

即可进入控制台（即自动打开的浏览器弹窗）。

## 加载测试文件

在 Jupyter 控制台的导航窗口中打开待测案例的脚本文件，双击或者选中后点击 open 打开。

随后浏览器会弹出一个新的标签页面打开该文件。

## 在 Jupyter 中运行 Python

如何运行一个 Jupyter Notebook 工程？我们可以查看下面这个案例：用 Python 计算

```python
# some python code to calculate pi
import math

pi_estimate = 0.0
terms_in_series = 50

for k in range(terms_in_series):
pi_estimate += ( -1.0 / 3.0 )**k/( 2.0 *k+ 1.0 )
pi_estimate = math.sqrt( 12 )*pi_estimate

print( "Pi is approximately {0}" .format(pi_estimate))
```

要运行该单元格中的代码，请执行以下两个步骤：

点击单元格，以选定该单元。

同时按下键盘上的 SHIFT+ENTER 键， 或者点击上方工具栏中的"▶"按钮。

成功运行后，该单元格的下行会展示运行结果，如图所示。

## 安装必要的库

在介绍与 CST Studio Suite 相关的特定导入之前，让我们先导入几个我们将要使用的通用库。

运行以下代码，报错提示缺少库的时候，使用 pip 安装缺少的库，直到无报错出现。

```python
import time
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import minimize
import tempfile

tmp = tempfile.gettempdir()
%matplotlib notebook
```

使用 pip 安装库时，将报错的内容（提示缺少xx库），复制库的名称，替换下面命令的 numpy ，然后运行即可。

```bash
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple numpy
```

## 检查 CST 相关库和接口是否正确

现在，开始执行下面的代码，加载一些 CST Python 库。

```python
# cst related imports
import cst
import cst.interface
import cst.results

print(cst.__file__)
# should print '<PATH_TO_CST_AMD64>\\python_cst_libraries\\cst\\__init__.py'
```

## 成功

如果成功执行该命令，该单元格的输出将打印库的路径，例如 C:\Program Files (x86)\CST Studio Suite 2020\AMD64\python_cst_libraries\cst\__init__.py

在这种情况下，可以直接导入 CST Python 库，这是因为在该解释器中安装了一个最小软件包，该软件包与实际安装的 CST Studio Suite 相链接。

更多信息请参见在线帮助中的概述。

## 失败

如果您没有安装该软件包，或者添加/修改了 PythonPath 系统环境变量（不推荐），您可以使用 sys.path.append 方法来确保您的解释器可以找到 CST Python 库。

```python
import sys
sys.path.append( "C:\\Program Files (x86)\\CST Studio Suite 2022\\AMD64\\python_cst_libraries" )

# cst related imports
import cst
import cst.interface
import cst.results

print(cst.__file__)
# should print '<PATH_TO_CST_AMD64>\\python_cst_libraries\\cst\\__init__.py'
```

## 调用 CST Design Environment

现在，让我们调用 CST Design Environment，开始初始化"连接"。

```python
project = cst.interface.DesignEnvironment()
```

执行该代码，打开 CST Design Environment，会出现提示"静态/脚本模式已激活，弹出窗口已被阻止"弹窗，点击"Swich to Interactive Mode"切换到交互模式即可。

## 创建空项目

然后运行下面的单元格，创建一个空的 CST Microwave Studio 项目。

```python
mws_project = project.new_mws()
```

```python
mws_project.activate()
```

参数 activate() 会确保我们创建的项目是当前激活的项目。

在做其他事情之前，我们先将项目保存在当前用户的 TEMP 文件夹中，即 C:\Users\<Users>\AppData\Local\Temp 路径。

```python
mws_project.save(tmp+ "\\CST_TEST.cst" )
```

如果提示"文件已存在"，说明此前已经保存过该文件到该目录，没有赋予文件操作相关的命令，无法覆盖保存。

可以修改拟保存的项目名称，也可以在文件管理器中访问该路径删除原有文件。

此外，用户也可以根据自己的需求，将项目文件保存到指定的位置。

## 查询求解器

作为最后的通信检查，我们将查询激活的 3D 求解器。请执行下面的单元格并观察输出。

```python
mws_project.model3d.get_active_solver_name()
```

然后，在 CST Microwave Studio 中更改求解器，并再次执行该代码。

## 创建参数

下面的单元格将用 Python 在模型中创建/更改一个名为 offset 的参数。

```python
mws_project.model3d.StoreDoubleParameter( "offset" , 3 )
```

请检查该参数在项目参数列表中是否可见。

## 总结

在整个测试的过程中，若注意以下问题，将会使得整个测试过程更加顺利：

安装适合的 Python 版本，并正确地添加环境变量。

将 Python 的下载源设置为国内的源，例如清华大学。

在测试过程中，如遇到 IPython 相关的警告或报错，可以考虑将 %matplotlib notebook 替换成 %matplotlib inline 。
