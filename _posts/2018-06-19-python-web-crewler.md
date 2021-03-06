---
layout:     post
title:      论如何批量下载大哥哥大姐姐
subtitle:   我真的真的真的没有开车
date:       2018-06-19
author:     Tao Hong
header-img: img/home-bg.jpg
catalog: true
tags:
    - 瞎扯
    - python
---
# 首先来讲讲什么叫python
> 就是一种脚本语言

Python（英国发音：/ˈpaɪθən/ 美国发音：/ˈpaɪθɑːn/）, 是一种面向对象的解释型计算机程序设计语言，由荷兰人Guido van Rossum于1989年发明，第一个公开发行版发行于1991年。

Python是纯粹的自由软件， 源代码和解释器CPython遵循 GPL(GNU General Public License)协议。Python语法简洁清晰，特色之一是强制用空白符(white space)作为语句缩进。

Python具有丰富和强大的库。它常被昵称为胶水语言，能够把用其他语言制作的各种模块（尤其是C/C++）很轻松地联结在一起。常见的一种应用情形是，使用Python快速生成程序的原型（有时甚至是程序的最终界面），然后对其中有特别要求的部分，用更合适的语言改写，比如3D游戏中的图形渲染模块，性能要求特别高，就可以用C/C++重写，而后封装为Python可以调用的扩展类库。需要注意的是在您使用扩展类库时可能需要考虑平台问题，某些可能不提供跨平台的实现。

Python已经成为最受欢迎的程序设计语言之一。2011年1月，它被TIOBE编程语言排行榜评为2010年度语言。自从2004年以后，python的使用率呈线性增长。7月20日，IEEE发布2017年编程语言排行榜：Python高居首位。

# 再来讲讲什么是PHP

……

# 性质

python最常见的作用，就是爬取信息，也就是编写「爬虫」获取特定的信息的行为。

说白了，他们就是一堆类似「爬虫」一样的程序，源源不断地在网页站点上爬取有用的内容。「爬虫」是一种「自动化浏览网络」的程序，能在互联网中根据需要进行定制和修改，造访特定或普遍的网站，以获取数据。就像一只大肥虫子在菜叶上，不知疲倦地爬来爬去。据估计，网页中有超过一半的访问量，都是「爬虫」贡献的。也就是说……咳咳……不说了。

# 用途

或许你会说：这些看起来这么恶心的东西，关我什么事儿？

错了！这玩意儿跟你的关系大着呢。

首先，你去过`铁路12306`以外的地方购买火车票吗？

其次，你在第三方途径买过级机票吗？比如`微信`和`百度糯米`以及`美团`。

再次，我不信你没有在`搜索引擎`里查找过信息。

最早利用「爬虫」这个技术的是搜索引擎，为了更精确地检索到互联网上大大小小的关键字信息。几乎每一个网页的页面，都会被「爬虫」爬取一遍。当然，这也包括你的QQ空间。

然而近年来，随着技术的发展，「爬虫」不仅游弋在互联网金融、电商、社交平台的藤条上，同时也在进一步提升着数据处理能力，现在也纷纷进化出了获取网站数据，监控同类商品价格的技能，甚至还能够模仿人类行为进行验证码的输入和点赞等操作。

你在淘宝京东天猫中剁手下单买的东西查的看物流信息，是爬虫帮你干的，爬虫携带着你的电话号码等信息从物流快递的网站上帮你查询物流信息，然后将其带回到购物 APP 中，便于你了解剁手之后的商品什么时候回到你手上。

你在飞猪上买的火车票机票以及订的酒店，~~几乎~~ 都是「爬虫」携带你的信息去帮你干的。包括电话号码身份证……

以及啊，当你使用百度的时候，检索的关键词大多都是「爬虫」爬取之后获取的存储的信息，然后检索的时候将其提取，最后你会在搜索列表里看到那些相关的页面和结果。

最近大多数同学们都经历过四六级查分的激情时光吧？所有的第三方（除了`国家考试中心`和`学信网`之外的所有场合）途径，如支付宝和微信，都是要你输入信息后，然后指使着一堆爬虫们到那两个官方途径中帮你查询，并且携带着数据返回到你所在的第三方途径。怎么样，听起来是不是很刺激吖？

「爬虫」，满地都有，互联网的世界真热闹！

# 进一步说明

举个简单的例子：

搜索引擎利用爬虫进行数据整合以及数据处理，以得到更精确的搜索结果。每一个搜索引擎都会给你提供「网页快照」，供你了解该网站在不久前的状况，或者在站点连接不稳定的时候给你提供之前「爬」下来的页面进行访问。

我们在搜索引擎里输入信息，会得到一个如下的页面：

(p1)

这是我的博客被「爬虫」爬取的结果：

(p2)

但是，「爬虫」也有「好与坏」之分。

其中一个问题就是：**爬虫泛滥**。

还有一个更严重的问题就是：**恶意访问**。

截止到 2007 年底，Internet 上网页数量超出 160 亿个，而现在的页面往往由多个复杂的地址的内同共同构成，这使得网络爬虫面临一定的困难，主要体现在 Web 信息的巨大容量使得爬虫在给定时间内只能下载少量网页，解决这个问题的简单粗暴的办法就是：增加爬虫数量。

而爬虫的数量增多后，往往会出现一些「幺蛾子爬虫」，会导致一系列问题，例如，恶意爬虫被幕后使者指使对某站点进行DDOS攻击，多家搜索引擎以及服务商轮流对某站点进行轰炸式访问导致访问量虚假等。

而且，据说，用爬虫爬取浙江大学的主页，会返回如下结果：

> `检测到你正在用非正常手段获取信息`

# 案例



# 未完待续