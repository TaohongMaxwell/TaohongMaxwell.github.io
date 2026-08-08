---
date: 2024-05-27
draft: false
title: "CST_with_Python（三）：仿真并绘制结果"
categories:
  - EM Simulation
tags:
  - CST
  - Python仿真
  - 自动化
  - 后处理
  - 电磁仿真
summary: 本文是关于CST与Python联合仿真的教程系列第三篇，详细介绍了如何使用Python控制CST求解器进行仿真计算、访问仿真结果并绘图，内容包括求解器运行、结果保存与访问、绘图方法等，适用于需要在CST中实现自动化仿真的工程师。
---
> 原文首发于我的微信公众号 **TaohongMaxwell**：[查看原文](https://mp.weixin.qq.com/s/O9CBfj1VQTGDKaR6MvrhOA)

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

本期为第 3 篇文章，详细介绍如何使用 Python 控制 CST 仿真、读取结果以及绘图。

## 一、准备工作

在此前的两篇文章中，我们分享了搭建 Python 测试环境的流程，并完成了建模、求解器设置等工作。

现在，我们尝试使用 Python 命令启动求解器，对模型进行求解计算，并绘制计算结果。本案例中，求解器为 T 求解器，频率范围为 8-10GHz。

本文后续的流程基于上一篇文章 《控制 CST 建模》 的模型操作，如果您保留了该模型，可以关联文件后基于该模型继续操作。 如果您未保留上一次的 CST 工程，请参考上述文章中的步骤重新建模。
## 二、求解

## 运行求解

完成建模及求解器设置等工作后，即可进行求解计算。

运行下面代码，求解器就会开始求解计算，可以打开软件窗口查看仿真进度条。

```python
mws_project.model3d.run_solver()
```

默认情况下，仿真结束时，命令 run_solver() 才会返回 Python 环境。

如果需要定时返回 Python 环境，可以根据任务需要，在这里设置返回 Python 环境的超时时间。

## 保存结果

单元格执行后，等到求解器运行结束，即可运行以下代码保存项目。

```python
mws_project.save()
```

项目保存在此前手动设定的路径中，如果未调整路径，默认保存在当前用户的 TEMP 文件夹中，即 C:\\Users\\<Users>\\AppData\\Local\\Temp

## 访问结果

为了访问本次仿真的结果，我们使用了 cst.results 库。

```python
result_project = cst.results.ProjectFile(tmp + r\\"CST_TEST.cst" )
```

若直接运行上述代码，会出现报错，提示该项目已被打开。

这是因为：在默认的情况下，当前在 CST Studio Suite 中打开的项目的结果，无法被外部访问。

要访问结果，我们需要做一些措施：

可以使用 mws_project.close() 关闭项目，在工程文件被关闭的状态下访问仿真结果。

或者使用 allow_interactive=True 参数取消访问限制。

以下为使用 allow_interactive=True 的命令：

```python
result_project = cst.results.ProjectFile(tmp + r\\"CST_TEST.cst" , allow_interactive= True )
```

## 查看结果

访问结果项目后，可以使用 result_project.get_3d_results() 方法获取 3D 结果项。

其中，从树结构来看，可以看到所有的 3D 结果项，以 mfarfield (f=9) [1] 为例，表示基于 1 端口、9GHz 激励下的远场场。

其中包含了一些子结果，例如 Directivity, Gain, Realized Gain, Cross Polarization, Efficiency 等。

可以直接通过索引号访问，例如 result_project.get_3d_results()[0] 获得第一个结果项。

获取到结果项后，可以使用 item.data() 方法获得其数据。该数据包含频率值和所有方向上的子结果数据，以 0.01° 为采样步长。

## 绘图

根据上一步获取的结果数据，可以编写代码，对计算结果进行绘图。

可以调用 matplotlib 库进行绘图，以下代码绘制 9GHz 下的远场方向图 (Farfield)。

在这里，我们选择 Realized Gain 数据进行绘图。

从极坐标图中观察到了最大值为 4.85 dBi，后瓣较小，说明天线在该频点处性能良好。

除了远场方向图以外，还可以绘制 S 参数曲线。

```python
# 创建结果项目文件
result_project2 = cst.results.ProjectFile(tmp + r\\"CST_TEST.cst",allow_interactive=True)

# 获取 1D 结果项
items1d = result_project2.get_1d_results()

# 获取 S 参数数据
s_param = items1d['S-Parameters'].data()

# 获取频率值和 S 参数值
freq = s_param['Frequency']
s11 = s_param['S1,1']

# 绘制 S 参数曲线
plt.figure
plt.plot(freq / 1e9, 20 * np.log10(np.abs(s11)))
plt.xlabel('Freq (GHz)')
plt.ylabel('S11 (dB)')
plt.grid(True)
plt.show()
```

查看绘制的 S 参数曲线，在 9GHz 处，S11 低于 -10dB，说明天线在该频点有较好的阻抗匹配。

## 三、总结

在这篇文章中，我们介绍了如何使用 Python 编写代码控制 CST 求解、访问并处理结果数据、绘制仿真结果的流程。

在后续的文章中，我们将使用进阶技巧，讲述如何使用 Python 对 CST 的仿真模型实现参数优化和后处理。
