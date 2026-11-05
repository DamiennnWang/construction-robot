window.COURSE = {
  "scope": "full",
  "chapters": [
    {
      "id": 1,
      "title": "走进智能建造",
      "nav": "走进智能建造",
      "description": "浏览常见施工机械与机器人，查看结构、部件和动作。",
      "entry": "course/chapters/01/overview/index.html",
      "kind": "三维展厅",
      "tasks": [
        {
          "id": "1-2",
          "title": "认识施工机械",
          "entries": [
            {
              "title": "进入机械展厅",
              "file": "course/chapters/01/tasks/1-2/index.html"
            }
          ],
          "kind": "三维展厅"
        },
        {
          "id": "1-3",
          "title": "认识施工机器人",
          "entries": [
            {
              "title": "进入机器人展厅",
              "file": "course/chapters/01/tasks/1-3/index.html"
            }
          ],
          "kind": "三维展厅"
        }
      ]
    },
    {
      "id": 2,
      "title": "动力与工作机构",
      "nav": "动力与工作机构",
      "description": "看动力如何产生、传递，再变成施工需要的动作。",
      "entry": "course/chapters/02/overview/index.html",
      "kind": "交互工位",
      "tasks": [
        {
          "id": "2-1",
          "title": "动力装置的基本原理",
          "entries": [
            {
              "title": "直流电机",
              "file": "course/chapters/02/tasks/2-1/index.html#motor"
            },
            {
              "title": "柴油机",
              "file": "course/chapters/02/tasks/2-1/index.html#diesel"
            }
          ],
          "kind": "交互工位"
        },
        {
          "id": "2-2",
          "title": "动力的传递与变换",
          "entries": [
            {
              "title": "齿轮 · 皮带 · 链条",
              "file": "course/chapters/02/tasks/2-2/index.html#gear"
            },
            {
              "title": "液压缸",
              "file": "course/chapters/02/tasks/2-2/index.html#hyd"
            },
            {
              "title": "气缸",
              "file": "course/chapters/02/tasks/2-2/index.html#air"
            }
          ],
          "kind": "交互工位"
        },
        {
          "id": "2-3",
          "title": "工作机构与施工动作",
          "entries": [
            {
              "title": "液压缸 · 动臂",
              "file": "course/chapters/02/tasks/2-3/index.html#boom"
            },
            {
              "title": "丝杠 · 升降台",
              "file": "course/chapters/02/tasks/2-3/index.html#screw"
            }
          ],
          "kind": "交互工位"
        }
      ]
    },
    {
      "id": 3,
      "title": "机器人结构与运动",
      "nav": "机器人结构与运动",
      "description": "认构型、动关节、看传动、换工具，再对照底盘与行走。",
      "entry": "course/chapters/03/overview/index.html",
      "kind": "交互课堂",
      "tasks": [
        {
          "id": "3-1",
          "title": "机器人构型与工作空间识读",
          "entries": [
            {
              "title": "进入学习",
              "file": "course/chapters/03/tasks/3-1/index.html"
            }
          ],
          "kind": "交互课堂"
        },
        {
          "id": "3-2",
          "title": "六轴机械臂本体、关节轴与低速点动",
          "entries": [
            {
              "title": "进入学习",
              "file": "course/chapters/03/tasks/3-2/index.html"
            }
          ],
          "kind": "交互课堂"
        },
        {
          "id": "3-3",
          "title": "关节驱动、减速器与传动机构",
          "entries": [
            {
              "title": "减速器实验室",
              "file": "course/chapters/03/tasks/3-3/reducers.html"
            },
            {
              "title": "运动转换实验室",
              "file": "course/chapters/03/tasks/3-3/conversion.html"
            }
          ],
          "kind": "交互课堂"
        },
        {
          "id": "3-4",
          "title": "末端执行器、TCP与工具控制",
          "entries": [
            {
              "title": "进入学习",
              "file": "course/chapters/03/tasks/3-4/index.html"
            }
          ],
          "kind": "交互课堂"
        },
        {
          "id": "3-5",
          "title": "移动底盘与行走机构",
          "entries": [
            {
              "title": "进入学习",
              "file": "course/chapters/03/tasks/3-5/index.html"
            }
          ],
          "kind": "交互课堂"
        }
      ]
    },
    {
      "id": 4,
      "title": "感知与智能识别",
      "nav": "感知与智能识别",
      "description": "认识自身状态、环境扫描与图像识别，保留观测和复核依据。",
      "entry": "course/chapters/04/overview/index.html",
      "kind": "交互课堂",
      "tasks": [
        {
          "id": "4-1",
          "title": "机器人自身状态感知",
          "entries": [
            {
              "title": "状态与数据",
              "file": "course/chapters/04/tasks/4-1/index.html"
            }
          ],
          "kind": "交互课堂"
        },
        {
          "id": "4-2",
          "title": "机器人激光雷达感知",
          "entries": [
            {
              "title": "扫描与点云",
              "file": "course/chapters/04/tasks/4-2/index.html"
            }
          ],
          "kind": "交互课堂"
        },
        {
          "id": "4-3",
          "title": "标注安全帽并应用YOLO模型",
          "entries": [
            {
              "title": "标注实验",
              "file": "course/chapters/04/tasks/4-3/index.html#annotation"
            },
            {
              "title": "预测实验",
              "file": "course/chapters/04/tasks/4-3/index.html#predict"
            },
            {
              "title": "评估实验",
              "file": "course/chapters/04/tasks/4-3/index.html#evaluate"
            }
          ],
          "kind": "交互课堂"
        }
      ]
    },
    {
      "id": 5,
      "title": "主体结构施工",
      "nav": "主体结构施工",
      "description": "钢筋加工、绑扎与人工复核，再进入混凝土泵送、振捣和整平。",
      "entry": "course/chapters/05/overview/index.html",
      "kind": "互动课堂",
      "tasks": [
        {
          "id": "5-1",
          "title": "钢筋加工机械与绑扎作业面识读",
          "entries": [
            {
              "title": "加工与作业面",
              "file": "course/chapters/05/tasks/5-1/index.html"
            }
          ],
          "kind": "交互课堂"
        },
        {
          "id": "5-2",
          "title": "钢筋绑扎机器人操作与人工复核",
          "entries": [
            {
              "title": "绑扎与人工复核",
              "file": "course/chapters/05/tasks/5-2/index.html"
            }
          ],
          "kind": "交互课堂"
        },
        {
          "id": "5-3",
          "title": "混凝土泵送、振捣与整平",
          "entries": [
            {
              "title": "进入交互实训",
              "file": "course/chapters/05/tasks/5-3/index.html"
            }
          ],
          "kind": "交互实训"
        }
      ]
    },
    {
      "id": 6,
      "title": "装饰装修施工",
      "nav": "装饰装修施工",
      "description": "走进砌筑、铺贴、打磨与喷涂，对照工艺、反馈和质量。",
      "entry": "course/chapters/06/overview/index.html",
      "kind": "交互课堂",
      "tasks": [
        {
          "id": "6-1",
          "title": "砌筑工程——人工工艺、砂浆机械与机器人进场",
          "entries": [
            {
              "title": "砌筑课堂",
              "file": "course/chapters/06/tasks/6-1/index.html"
            }
          ],
          "kind": "交互课堂"
        },
        {
          "id": "6-2",
          "title": "地砖铺贴——工艺准备与铺贴机器人作业",
          "entries": [
            {
              "title": "铺贴实训",
              "file": "course/chapters/06/tasks/6-2/index.html"
            }
          ],
          "kind": "交互课堂"
        },
        {
          "id": "6-3",
          "title": "腻子打磨——作业面检查、恒力执行与质量验收",
          "entries": [
            {
              "title": "打磨工坊",
              "file": "course/chapters/06/tasks/6-3/index.html"
            }
          ],
          "kind": "交互课堂"
        },
        {
          "id": "6-4",
          "title": "室内喷涂——路径规划、参数控制与缺陷诊断",
          "entries": [
            {
              "title": "喷涂工坊",
              "file": "course/chapters/06/tasks/6-4/index.html"
            }
          ],
          "kind": "交互课堂"
        }
      ]
    },
    {
      "id": 7,
      "title": "巡检与数据复核",
      "nav": "巡检与数据复核",
      "description": "利用移动机器人与无人机取证，复核检测与影像线索。",
      "entry": "course/chapters/07/overview/index.html",
      "kind": "交互课堂",
      "tasks": [
        {
          "id": "7-1",
          "title": "巡检机器人——轮式、四足与爬壁",
          "entries": [
            {
              "title": "桥梁巡检",
              "file": "course/chapters/07/tasks/7-1/index.html"
            }
          ],
          "kind": "交互课堂"
        },
        {
          "id": "7-2",
          "title": "建筑外立面无人机巡检与影像证据复核",
          "entries": [
            {
              "title": "无人机巡检与复核",
              "file": "course/chapters/07/tasks/7-2/index.html"
            }
          ],
          "kind": "交互课堂"
        }
      ]
    },
    {
      "id": 8,
      "title": "安全操作与维护",
      "nav": "安全操作与维护",
      "description": "在现场暂停推演中处理危险，在四个工位练习保养与排查。",
      "entry": "course/chapters/08/overview/index.html",
      "kind": "互动课堂",
      "tasks": [
        {
          "id": "8-1",
          "title": "安全操作",
          "entries": [
            {
              "title": "进入互动推演",
              "file": "course/chapters/08/tasks/8-1/index.html"
            }
          ],
          "kind": "互动推演"
        },
        {
          "id": "8-2",
          "title": "保养排查",
          "entries": [
            {
              "title": "进入互动工坊",
              "file": "course/chapters/08/tasks/8-2/index.html"
            }
          ],
          "kind": "互动工坊"
        }
      ]
    }
  ]
};
