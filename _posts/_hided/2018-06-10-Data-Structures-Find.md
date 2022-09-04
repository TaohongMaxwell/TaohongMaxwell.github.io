---
layout:     post
title:      数据结构——查找的学习（作业）日志
subtitle:   论查找，还是手动比较快……
date:       2018-06-10
author:     Li qin
header-img: img/post-bg-coder.jpg
catalog: true
tags:
    - C/C++
    - 数据结构
---
### 原文地址：[Li qin的博客园](https://www.cnblogs.com/1795759388-/p/9094405.html)
<br>

---

# 1.学习总结
## 查找的思维导图
![](https://images2018.cnblogs.com/blog/1233587/201805/1233587-20180527225035576-357183968.png)

## 查找学习体会

> 查找这一章的知识点还是很多的，二叉搜索树，B-树，哈希表。一些基本操作还算是掌握，像插入删除操作都掌握的差不多了，但是转化成代码却不是很熟练，而且很多都用递归来完成，有些难理解，还需要时间来消化。还有就是LL,LR型调整不熟练，过一会就忘了解决哈希冲突也是偶尔会出错，还需要再练习

# 2.PTA实验作业
## 题目1：6-2 是否二叉搜索树
#### 设计思路（伪代码或流程图）

```
   定义一个静态变量min=-32768
   if二叉树为空，则他是二叉搜索树，return true;
   IsBST (T->Left);
   if关键字>min  min=关键字；
   else return false;
    IsBST(T->Right)
	return true;
```

#### 代码截图

![](https://images2018.cnblogs.com/blog/1233587/201805/1233587-20180526214505329-1953969693.png)

#### PTA提交列表说明

![](https://images2018.cnblogs.com/blog/1233587/201805/1233587-20180526214550412-1579189410.png)
- 错误代码：

```
bool IsBST ( BinTree T )
{
    if (T== NULL)
        return true;
    if (T->left != NULL && T->left->data>T->data)
        return false;
    if (T->right != NULL && T->right->data < T->data)
        return false;
    if (! IsBST(T>left) || ! IsBST(T->right))
        return false;
    return true;
}
```

- 错误：一开始我的思路比较简单：对每一个节点，检测其值是否大于左子树节点，是否小于右子树节点同时满足这两个条件就是二叉搜索树。提交到pta那边在测试点：sample2 等价, NO和左右都是，但答案是NO错了；
- 解决办法：一开始我以为是漏了哪种情况没有考虑进去，后来发现是我的逻辑有问题。按照我的判断方法

```
              3
            /   \
          2       5
        /   \
      1       4
```

> 上面那棵二叉树也被判定为二叉搜索树，因为每个检测都符合我的条件，但是我忽略了他的祖先节点导致错误，后来改了一下，用中序遍历就不会出现这个问题了。

<br>
## 题目2： 二叉搜索树中的最近公共祖先

#### 设计思路（伪代码或流程图）

```
int find(Tree T,int number){
    空树返回0
    找到返回1
    在左子树上
    return find(T->Left,number);
        在右子树上
    return find(T->Right,number);
}

int find(Tree T,int u) {
     T为空树 返回ERROR
     if  u,v都在左子树上；return LCA(T->Right,u,v);
     if  u,v都在右子树上；return LCA(T->Left,u,v);
     if u,v一个在左子树上，一个在右子树上；return T->Key;
     if u,v有一个在根上。 return T->Key;
}

```
#### 代码截图

![](https://images2018.cnblogs.com/blog/1233587/201805/1233587-20180526222134281-285070508.png)


#### PTA提交列表说明。
![](https://images2018.cnblogs.com/blog/1233587/201805/1233587-20180526222211333-1679287019.png)

- 错误：一开始上面的这些情况基本上是想到一个写一个，但是提交以后就对了两个测试点
- 解决办法：后来按照伪代码所描述的修改了顺序，对的测试点多了，但是也并没有全对。
- 再后来自己加了一个函数查找u是否在树中，就对了

<br>
## 题目3：QQ帐户的申请与登陆

#### 设计思路（伪代码或流程图）

```
       int n,i;
	char PassWord[30],IDNumber[20],control[2];
	map<string,string>Q;
       输入组数n
             for( i=0 to i<n i++){
                    输出字符串control
                    control[0]=='N'为新用户时
                       申请账号密码
                         已存在该账号时输出ERROR: Exist；
                         否则输出New: OK
                   control[0]=='L' 旧用户登陆
                      输入账号密码
                      无该用户时，输出ERROR: Not Exis；
                       否则输出Login: OK

```

#### 代码截图
![](https://images2018.cnblogs.com/blog/1233587/201805/1233587-20180526232656931-1839189984.png)

#### PTA提交列表说明。
![](https://images2018.cnblogs.com/blog/1233587/201805/1233587-20180526232722165-1599397219.png)


# 3.截图本周题目集的PTA最后排名

#### PTA排名
![](https://images2018.cnblogs.com/blog/1233587/201805/1233587-20180526232804095-1253455400.png)

#### 我的总分：
- 115

# 4.阅读代码

- [线性探测法和二次探测法，链地址法实现哈希表的查找](https://blog.csdn.net/qq_35644234/article/details/68068293)

> 线性探测法和二次探测法，链地址法三种方法都有，建表，查找删除操作都有包括，而且基本上每个重要操作都是分装成单独的函数的，较为严谨，重要操作也都给了注释，帮助理解代码

# 5.代码Git提交记录截图

![](https://images2018.cnblogs.com/blog/1233587/201805/1233587-20180527232423228-336465598.png)
