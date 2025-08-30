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

## 依存関係

### コア依存関係
- **State Management**: `zustand` ^4 - 軽量で直感的な状態管理
- **Backend**: `firebase` ^11 - モジュラーv9+ API使用
- **3D Rendering**: `expo-three` + `expo-gl` + `expo-asset` - Expo管理環境での3Dレンダリング
- **Types**: `@types/three` - Three.js型定義

### 設定状況
- ✅ **Zustand**: インストール済み（設定準備完了）
- ✅ **Firebase**: インストール・初期化済み（環境変数設定で有効化）
- ✅ **Three.js**: インストール済み（`src/lib/three.ts`にプレースホルダー作成）
- 🔄 **設定**: Firebase完了、Three.js設定は将来実装予定

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

### 環境変数の設定

Firebase機能を使用するには、プロジェクトルートに `.env` ファイルを作成してください：

```bash
# .env
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_APP_ID=your_app_id
```

**セットアップ手順**:
1. Firebase Console（https://console.firebase.google.com）でプロジェクトを作成
2. プロジェクト設定 > 全般タブから設定値を取得
3. 上記の値を `.env` ファイルに設定

**注意**: 
- `.env` ファイルは `.gitignore` に含まれています
- 現在は設定なしでもアプリは動作します（Firebase機能は無効）
- Expo環境変数は `process.env.*` でアクセス可能

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
│   ├── index.ts                 # ユーティリティ関数
│   ├── firebase.ts              # Firebase v11初期化・ヘルパー
│   └── three.ts                 # Three.js設定（プレースホルダー）
├── repositories/
│   ├── index.ts                 # リポジトリエクスポート
│   ├── paths.ts                 # Firestoreパスビルダー
│   ├── planetGoalRepository.ts  # 惑星目標CRUD
│   ├── civilizationRepository.ts # 文明CRUD
│   └── progressLogRepository.ts # プログレスログCRUD
├── theme/
│   ├── colors.ts                # カラーテーマ定義
│   └── spacing.ts               # スペーシング定義
└── types.ts                     # コア型定義
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
