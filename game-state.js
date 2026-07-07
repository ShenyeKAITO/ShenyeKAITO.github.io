/* ===== 全局状态管理系统 =====
 * 所有页面通过 localStorage 共享游戏进度
 * 一个页面发现线索 → 所有页面自动更新
 */

var GameState = {
  // ===== 基础读写 =====
  get(key) {
    try {
      return JSON.parse(localStorage.getItem('game_' + key));
    } catch {
      return null;
    }
  },

  set(key, value) {
    localStorage.setItem('game_' + key, JSON.stringify(value));
  },

  // ===== 进度管理 =====
  init() {
    if (!this.get('chatRound')) this.set('chatRound', 0);
    if (!this.get('clues')) this.set('clues', []);
    if (!this.get('unlockedPages')) this.set('unlockedPages', ['index']);
    if (!this.get('gameStarted')) this.set('gameStarted', false);
    if (!this.get('passwordAttempts')) this.set('passwordAttempts', 0);
    if (!this.get('qqLoggedIn')) this.set('qqLoggedIn', false);
  },

  // ===== 线索系统 =====
  addClue(clueId) {
    const clues = this.get('clues') || [];
    if (!clues.includes(clueId)) {
      clues.push(clueId);
      this.set('clues', clues);
    }
  },

  hasClue(clueId) {
    return (this.get('clues') || []).includes(clueId);
  },

  getClueCount() {
    return (this.get('clues') || []).length;
  },

  // ===== 页面解锁 =====
  unlockPage(pageId) {
    const unlocked = this.get('unlockedPages') || [];
    if (!unlocked.includes(pageId)) {
      unlocked.push(pageId);
      this.set('unlockedPages', unlocked);
    }
  },

  isPageUnlocked(pageId) {
    // index 永远可访问
    if (pageId === 'index') return true;
    return (this.get('unlockedPages') || []).includes(pageId);
  },

  // ===== 对话进度 =====
  advanceChat() {
    const round = (this.get('chatRound') || 0) + 1;
    this.set('chatRound', round);
    return round;
  },

  getChatRound() {
    return this.get('chatRound') || 0;
  },

  // ===== QQ登录 =====
  attemptPassword(password) {
    const correctPassword = this.get('correctPassword') || '1225';
    if (password === correctPassword) {
      this.set('qqLoggedIn', true);
      this.unlockPage('others_message_list');
      this.unlockPage('others_chat');
      this.unlockPage('others_qzone');
      this.unlockPage('netease_music');
      return true;
    }
    this.set('passwordAttempts', (this.get('passwordAttempts') || 0) + 1);
    return false;
  },

  // ===== 结束检查 =====
  canEnd() {
    const clues = this.get('clues') || [];
    // 需要至少找到关键线索才能进入结局
    return clues.length >= 1 && this.get('qqLoggedIn');
  },

  // ===== 重置 =====
  reset() {
    // 获取所有 game_ 开头的 key 并删除
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith('game_')) localStorage.removeItem(k);
    });
  },

  // ===== 监听其他窗口的变化 =====
  onChange(callback) {
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('game_')) {
        const stateKey = e.key.replace('game_', '');
        try {
          callback(stateKey, JSON.parse(e.newValue), JSON.parse(e.oldValue));
        } catch {}
      }
    });
  },

  // ===== 获取游戏通关密码（从线索推断，供子页面使用） =====
  setCorrectPassword(pwd) {
    this.set('correctPassword', pwd);
  },

  // ===== 清除 chatFinished 标记（用于跳出卡死的消失页面） =====
  clearFinished() {
    localStorage.removeItem('game_chatFinished');
  }
};
