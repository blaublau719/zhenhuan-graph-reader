
🔧 前端集成代码示例：

// 加载完整事件数据
fetch('zhenhuan_complete_events.json')
  .then(res => res.json())
  .then(events => {

    // 按章节索引
    const eventsByChapter = {};
    events.forEach(e => {
      const key = `${e.volume}-${e.chapter}`;
      if (!eventsByChapter[key]) eventsByChapter[key] = [];
      eventsByChapter[key].push(e);
    });

    // 翻页时触发
    function onChapterChange(volume, chapter) {
      const key = `${volume}-${chapter}`;
      const chapterEvents = eventsByChapter[key] || [];

      chapterEvents.forEach(event => {
        if (event.type === 'status_change') {
          // 更新节点标签
          updateNode(event.character, event.title);
        } else {
          // 更新关系边
          updateEdge(event.characters, event.relationship);
        }
      });
    }
  });

📝 数据结构说明：
{
  "id": 1,
  "volume": 1,        // 卷数
  "chapter": 1,       // 章节
  "event": "...",     // 事件描述
  "type": "status_change" | "relationship",

  // 如果是 status_change:
  "character": "甄嬛",
  "title": "莞贵人（正六品）",

  // 如果是 relationship:
  "characters": ["甄嬛", "安陵容"],
  "relationship": "结盟"
}
