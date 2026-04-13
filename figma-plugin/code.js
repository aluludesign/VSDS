// ============================================================
// Bottom Sheet Builder — VSDS Figma Plugin
// 在 Main component > content (28119:2293) 建立四種模式
// ============================================================

(async () => {

  // ── 1. 載入字型 ────────────────────────────────────────────
  await Promise.all([
    figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Bold' }),
  ]);

  // ── 2. 找到 content frame ──────────────────────────────────
  const contentFrame = figma.getNodeById('28119:2293');
  if (!contentFrame || contentFrame.type !== 'FRAME') {
    figma.notify('❌ 找不到 content frame (28119:2293)，請確認此 Plugin 在正確的 Figma 檔案中執行');
    return figma.closePlugin();
  }

  // ── 3. 匯入元件 ────────────────────────────────────────────
  // menu Size=md, State=default
  // .menu/element: radio button, checkbox, icon
  const [menuComp, radioComp, checkboxComp, iconComp] = await Promise.all([
    figma.importComponentByKeyAsync('9307edb9fa5415d3fa8fb7a4e8c90b6717ee32f3'),
    figma.importComponentByKeyAsync('744b6d5b182560ccd7e8a91cb735f05273229b50'),
    figma.importComponentByKeyAsync('097cbc20e7634d690c3874a1845646e9f7bf6072'),
    figma.importComponentByKeyAsync('cdd6fa2137fc5841fd3cdaacce898e40f362da6d'),
  ]);

  const W = 390; // iPhone 15 Pro width

  // ── Helpers ────────────────────────────────────────────────

  /** Bottom sheet 外框 */
  function createSheet(name) {
    const f = figma.createFrame();
    f.name = name;
    f.layoutMode = 'VERTICAL';
    f.itemSpacing = 0;
    f.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    f.topLeftRadius = 20;
    f.topRightRadius = 20;
    f.bottomLeftRadius = 0;
    f.bottomRightRadius = 0;
    f.counterAxisSizingMode = 'FIXED';
    f.primaryAxisSizingMode = 'AUTO';
    f.resize(W, f.height);
    f.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.12 },
      offset: { x: 0, y: -4 },
      radius: 24,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    }];
    return f;
  }

  /** 頂部把手 */
  function addHandle(f) {
    const wrap = figma.createFrame();
    wrap.name = 'handle-bar';
    wrap.layoutMode = 'HORIZONTAL';
    wrap.primaryAxisAlignItems = 'CENTER';
    wrap.counterAxisAlignItems = 'CENTER';
    wrap.paddingTop = 12;
    wrap.paddingBottom = 8;
    wrap.fills = [];
    wrap.layoutSizingHorizontal = 'FILL';
    wrap.layoutSizingVertical = 'HUG';
    const pill = figma.createFrame();
    pill.name = 'pill';
    pill.resize(40, 4);
    pill.cornerRadius = 2;
    pill.fills = [{ type: 'SOLID', color: { r: 0.8, g: 0.83, b: 0.87 } }];
    wrap.appendChild(pill);
    f.appendChild(wrap);
  }

  /** 標題列（標題 + 關閉按鈕） */
  function addTitleBar(f, title) {
    const bar = figma.createFrame();
    bar.name = 'title-bar';
    bar.layoutMode = 'HORIZONTAL';
    bar.primaryAxisAlignItems = 'SPACE_BETWEEN';
    bar.counterAxisAlignItems = 'CENTER';
    bar.paddingLeft = 24;
    bar.paddingRight = 24;
    bar.paddingTop = 4;
    bar.paddingBottom = 16;
    bar.fills = [];
    bar.layoutSizingHorizontal = 'FILL';
    bar.layoutSizingVertical = 'HUG';

    const t = figma.createText();
    t.fontName = { family: 'Inter', style: 'Bold' };
    t.fontSize = 18;
    t.characters = title;
    t.fills = [{ type: 'SOLID', color: { r: 0.08, g: 0.11, b: 0.18 } }];
    bar.appendChild(t);

    const closeBtn = figma.createFrame();
    closeBtn.name = 'close-btn';
    closeBtn.resize(32, 32);
    closeBtn.cornerRadius = 16;
    closeBtn.fills = [{ type: 'SOLID', color: { r: 0.94, g: 0.95, b: 0.97 } }];
    closeBtn.layoutMode = 'HORIZONTAL';
    closeBtn.primaryAxisAlignItems = 'CENTER';
    closeBtn.counterAxisAlignItems = 'CENTER';
    const cx = figma.createText();
    cx.fontName = { family: 'Inter', style: 'Regular' };
    cx.fontSize = 18;
    cx.characters = '×';
    cx.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.47, b: 0.56 } }];
    closeBtn.appendChild(cx);
    bar.appendChild(closeBtn);
    f.appendChild(bar);
  }

  /** Menu list 容器 */
  function addList(f) {
    const list = figma.createFrame();
    list.name = 'menu-list';
    list.layoutMode = 'VERTICAL';
    list.itemSpacing = 0;
    list.fills = [];
    list.layoutSizingHorizontal = 'FILL';
    list.layoutSizingVertical = 'HUG';
    f.appendChild(list);
    return list;
  }

  /**
   * 建立單一 Menu item instance
   * @param {string}    label       - 顯示文字
   * @param {Component} leftComp   - 左側 .menu/element 元件 (radio/checkbox/icon)
   * @param {boolean}   showArrow  - 是否顯示右側箭頭 (Hybrid/Action 用)
   * @param {boolean}   isLast     - 是否為最後一項 (隱藏 divider)
   */
  function createMenuItem(label, leftComp, showArrow, isLast) {
    const inst = menuComp.createInstance();
    inst.layoutSizingHorizontal = 'FILL';

    // 設定 Label 文字
    const labelNode = inst.findOne(n => n.type === 'TEXT' && n.name === 'Label Text');
    if (labelNode) labelNode.characters = label;

    // 設定顯示屬性
    try {
      inst.setProperties({
        'Show Center badge': false,
        'Show Right text': false,
        'Show Divider': !isLast,
        'Show Right Icon': showArrow,
      });
    } catch (e) { /* 部分屬性名稱可能略有差異，忽略錯誤 */ }

    // 置換左側 .menu/element 類型
    const startNode = inst.findOne(n => n.name === 'start' && n.type === 'INSTANCE');
    if (startNode) {
      try { startNode.swapComponent(leftComp); } catch (e) { }
    }

    return inst;
  }

  /** 底部「套用設定」按鈕（複選 / Hybrid 用） */
  function addFooter(f) {
    const footer = figma.createFrame();
    footer.name = 'footer';
    footer.layoutMode = 'VERTICAL';
    footer.paddingTop = 16;
    footer.paddingBottom = 32;
    footer.paddingLeft = 24;
    footer.paddingRight = 24;
    footer.fills = [];
    footer.layoutSizingHorizontal = 'FILL';
    footer.layoutSizingVertical = 'HUG';

    const btn = figma.createFrame();
    btn.name = 'apply-btn';
    btn.layoutMode = 'HORIZONTAL';
    btn.primaryAxisAlignItems = 'CENTER';
    btn.counterAxisAlignItems = 'CENTER';
    btn.paddingTop = 14;
    btn.paddingBottom = 14;
    btn.cornerRadius = 10;
    btn.fills = [{ type: 'SOLID', color: { r: 0.15, g: 0.38, b: 0.92 } }];
    btn.layoutSizingHorizontal = 'FILL';
    btn.layoutSizingVertical = 'HUG';

    const bt = figma.createText();
    bt.fontName = { family: 'Inter', style: 'Medium' };
    bt.fontSize = 16;
    bt.characters = '套用設定';
    bt.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    btn.appendChild(bt);
    footer.appendChild(btn);
    f.appendChild(footer);
  }

  // ── 建立四種 Bottom Sheet ───────────────────────────────────

  // ① 單選模式 — Radio button，點選即關閉，不需 Footer
  const sheet1 = createSheet('Bottom Sheet / 單選模式');
  addHandle(sheet1);
  addTitleBar(sheet1, '排序方式');
  const list1 = addList(sheet1);
  ['依名稱排序', '依上線時間排序', '依韌體版本排序', '依 IP 位置排序']
    .forEach((lbl, i, a) => list1.appendChild(
      createMenuItem(lbl, radioComp, false, i === a.length - 1)
    ));
  contentFrame.appendChild(sheet1);

  // ② 複選模式 — Checkbox，需套用 Footer
  const sheet2 = createSheet('Bottom Sheet / 複選模式');
  addHandle(sheet2);
  addTitleBar(sheet2, '顯示設定');
  const list2 = addList(sheet2);
  ['顯示離線設備', '顯示低電量設備', '顯示需要更新設備', '隱藏未分組設備']
    .forEach((lbl, i, a) => list2.appendChild(
      createMenuItem(lbl, checkboxComp, false, i === a.length - 1)
    ));
  addFooter(sheet2);
  contentFrame.appendChild(sheet2);

  // ③ 複合模式 (Hybrid) — 左 Checkbox 選取 + 右箭頭導航，需 Footer
  const sheet3 = createSheet('Bottom Sheet / 複合模式 (Hybrid)');
  addHandle(sheet3);
  addTitleBar(sheet3, '群組設定');
  const list3 = addList(sheet3);
  ['A棟教學樓群組', 'B棟實驗大樓群組', '行政區設備群組']
    .forEach((lbl, i, a) => list3.appendChild(
      createMenuItem(lbl, checkboxComp, true, i === a.length - 1)
    ));
  addFooter(sheet3);
  contentFrame.appendChild(sheet3);

  // ④ 純執行/入口 — Icon，點選即執行關閉，不需 Footer
  const sheet4 = createSheet('Bottom Sheet / 純執行．入口');
  addHandle(sheet4);
  addTitleBar(sheet4, '更多選項');
  const list4 = addList(sheet4);
  ['＋ 建立新群組', '↺ 重新整理列表', '⚙ 群組進階設定', '✕ 刪除選取裝置']
    .forEach((lbl, i, a) => list4.appendChild(
      createMenuItem(lbl, iconComp, true, i === a.length - 1)
    ));
  contentFrame.appendChild(sheet4);

  // ── 完成 ───────────────────────────────────────────────────
  figma.viewport.scrollAndZoomIntoView([contentFrame]);
  figma.notify('✅ 四種 Bottom Sheet 模式已建立完成！');
  figma.closePlugin();

})();
