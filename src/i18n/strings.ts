// アプリ全体で使用する文字列を一元管理
export const strings = {
  // アプリ名
  appName: 'StellarLog',
  
  // イントロ画面（Step 0）
  intro: {
    title: 'ようこそ、StellarLogへ',
    narrative: 'あなたが挑戦するたびに、\n星は呼吸し、文明は進化していく。\n\n偶然も、つまずきも、\nすべてが星の糧となり、\n少しずつ大地が広がり、\n灯りがともっていく。\n\nこれは、あなただけの物語を刻むアプリです。',
    cta: 'はじめる',
  },
  
  // チュートリアル（Step 1）
  tutorial: {
    title: '星のビジョン ＝ あなたが達成したい目標を設定しましょう。',
    cta: '星のビジョンを設定する',
    helper: '',
  },
  
  // 画面タイトル
  screens: {
    home: {
      title: 'StellarLog',
      hintTitle: '最初の挑戦を登録しましょう',
      hintCta: '挑戦を追加',
    },
    planetSettings: {
      title: '星のビジョンを決める',
      subtitle: 'このビジョンがあなたのStellarLogを導きます',
      fields: {
        vision: 'ビジョン',
        deadline: '期限',
      },
    },
    civilizations: {
      title: '挑戦',
      addButton: '挑戦を追加',
    },
  },
  
  // ボタン・アクション
  actions: {
    save: '保存',
    edit: '編集',
    delete: '削除',
    cancel: 'キャンセル',
    add: '追加',
    recordProgress: '成長ログを記録',
  },
  
  // メッセージ
  messages: {
    progressLogged: '成長ログを記録しました',
    progressFailed: '成長ログの記録に失敗しました',
    civilizationCreated: '挑戦が正常に作成されました',
    civilizationUpdated: '挑戦が正常に更新されました',
    civilizationDeleted: '挑戦が正常に削除されました',
    planetGoalSaved: '星のビジョンが正常に保存されました',
    loading: {
      vision: '星のビジョンを読み込み中...',
      civilizations: '挑戦を読み込み中...',
    },
  },
  
  // フォーム・バリデーション
  form: {
    required: '必須',
    titleRequired: '目標タイトルは必須です',
    deadlineRequired: '期限は必須です',
    invalidDate: '無効な日付形式です',
    pastDate: '期限は今日以降の日付を選択してください',
  },
  
  // 日付選択
  datePicker: {
    year: '年',
    month: '月',
    day: '日',
    selectYear: '年を選択',
    selectMonth: '月を選択',
    selectDay: '日を選択',
    yearMessage: '目標の期限年を選択してください',
    monthMessage: '目標の期限月を選択してください',
    dayMessage: '目標の期限日を選択してください',
    months: [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ],
    previous10: '前の10件',
    next10: '次の10件',
  },
  
  // 文明状態
  civilization: {
    states: {
      uninitialized: '未初期化',
      developing: '発展中',
      decaying: '衰退中',
      ocean: '海洋',
    },
    fields: {
      name: '挑戦名',
      purpose: '目的',
      deadline: '期限',
      lastProgress: '最終成長ログ',
    },
    emptyState: {
      title: 'まだ登録がありません',
      subtitle: 'まずは1つ追加しましょう。挑戦を登録すると、成長ログを追跡できます。',
    },
  },
  
  // 削除確認
  deleteConfirm: {
    title: '挑戦を削除',
    message: 'この操作は元に戻せません。',
    confirm: '削除',
  },
} as const;

// 型定義
export type StringKeys = keyof typeof strings;
export type IntroStrings = typeof strings.intro;
export type TutorialStrings = typeof strings.tutorial;
export type ScreenStrings = typeof strings.screens;
export type ActionStrings = typeof strings.actions;
export type MessageStrings = typeof strings.messages;
