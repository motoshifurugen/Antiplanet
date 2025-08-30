# Antiplanet

**A civilization lifecycle simulator built with Expo React Native**

## 概要

Antiplanetは惑星と文明のライフサイクルをシミュレートするMVPアプリケーションです。Expo SDK 53、TypeScript、React Navigation v7を使用して構築されています。

### 現在の機能（MVP版）

- **Planet View**: メインダッシュボード
- **Civilizations**: 文明一覧の表示（モックデータ）
- **Planet Settings**: 惑星目標と期限の設定フォーム

### 将来の追加予定機能

- 3Dプラネットビュー（expo-three）
- Firebase統合（データ永続化）
- リアルタイム文明シミュレーション
- より詳細な文明管理機能

## 技術スタック

- **Framework**: Expo SDK 53
- **Language**: TypeScript
- **Navigation**: React Navigation v7 (Native Stack)
- **Development**: ESLint + Prettier
- **Platform**: iOS / Android / Web

## セットアップと実行

### 前提条件

- Node.js (推奨: v18以上)
- npm または pnpm
- Expo CLI（グローバルインストール推奨）

### インストール

```bash
# 依存関係をインストール
npm install
# または
pnpm install
```

### 開発サーバーの起動

```bash
# 開発モードでExpoを起動
npm run dev
# または
npx expo start

# 特定のプラットフォームで起動
npm run ios      # iOS シミュレーター
npm run android  # Android エミュレーター
npm run web      # ブラウザ
```

### 開発ツール

```bash
# ESLintでコードチェック
npm run lint

# ESLintで自動修正
npm run lint:fix

# Prettierでコードフォーマット
npm run format

# TypeScript型チェック
npm run typecheck
```

## プロジェクト構造

```
src/
├── app/
│   └── navigation/
│       └── RootNavigator.tsx    # メインナビゲーション設定
├── screens/
│   ├── Home.tsx                 # ホームスクリーン
│   ├── Civilizations.tsx        # 文明一覧スクリーン
│   └── PlanetSettings.tsx       # 惑星設定スクリーン
├── components/
│   └── UI/
│       └── Screen.tsx           # 安全領域付きスクリーンラッパー
├── lib/
│   └── index.ts                 # ユーティリティ関数（今後拡張予定）
└── theme/
    ├── colors.ts                # カラーテーマ定義
    └── spacing.ts               # スペーシング定義
```

## 開発ガイドライン

- **コードスタイル**: Prettierの設定に従う（singleQuote: true, semi: true）
- **型安全性**: TypeScriptの厳密モードを使用
- **ナビゲーション**: React Navigation v7のnative-stackを使用
- **スタイリング**: React Nativeの標準StyleSheetを使用

## トラブルシューティング

### よくある問題

1. **Expo Goアプリで動作しない場合**
   - Expo Go アプリが最新版か確認
   - ネットワーク接続を確認

2. **依存関係のエラー**

   ```bash
   npm install --force
   # または
   rm -rf node_modules package-lock.json && npm install
   ```

3. **Metro bundlerの問題**
   ```bash
   npx expo start --clear
   ```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

**注意**: 3D機能（expo-three）とFirebase統合は将来のバージョンで追加予定です。
