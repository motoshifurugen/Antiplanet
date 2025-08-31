# Antiplanet

**A civilization lifecycle simulator built with Expo React Native**

## 概要

Antiplanetは惑星と文明のライフサイクルをシミュレートするMVPアプリケーションです。Expo SDK 53、TypeScript、React Navigation v7を使用して構築されています。

### 現在の機能（MVP版）

- **Planet View**: 3D惑星ビューアー
  - 低ポリゴン惑星と文明マーカー表示
  - ドラッグ回転・ピンチズーム操作
  - 文明マーカータップでボトムシート表示
  - プログレス記録（3Dマーカー即座更新）
  - 空状態・エラーハンドリング
- **Civilizations**: 完全CRUD機能付き文明管理
  - 文明一覧表示（導出状態・最終プログレス時刻）
  - 文明追加・編集・削除
  - プログレス記録（自動状態更新）
  - 空状態・ローディング・エラーハンドリング
- **Planet Settings**: 惑星目標管理
  - 目標タイトル・期限の設定・編集
  - 期限までの残り日数表示
  - バリデーション・変更検知・リセット機能
  - ローディング・成功・エラーハンドリング

### 現在の追加機能

- **文明状態システム**: 最終プログレスからの経過時間に基づく決定論的な状態評価
  - `uninitialized` → `developing` (0-6日) → `decaying` (7-20日) → `ocean` (21日+)
  - オンデマンド評価（タイマー不使用）
  - 重要な状態遷移のみ永続化
- **グローバルストア**: Zustandベースの状態管理
  - 匿名認証によるユーザー識別とセッション永続化
  - リポジトリ統合とステートマシン自動適用
  - プログレス記録時の自動状態更新
- **3Dレンダリング**: expo-three + Three.jsによる低ポリゴン惑星表示
  - オンデマンドレンダリング（連続アニメーションループなし）
  - 球面座標系による安定した文明マーカー配置
  - レイキャスティングによるタップ検出
  - ジェスチャーハンドラーでドラッグ・ピンチ操作

### 将来の追加予定機能

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
- ✅ **Zustand**: グローバルストア実装済み（モックユーザーでデータ管理）
- ✅ **Firebase**: インストール・初期化済み（環境変数設定で有効化）
- ✅ **State Machine**: 文明状態の決定論的評価システム実装済み
- ✅ **Three.js**: 完全実装済み（3D惑星・マーカー・ジェスチャー操作）
- ✅ **設定**: すべてのコア機能実装済み

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
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
```

**セットアップ手順**:
1. Firebase Console（https://console.firebase.google.com）でプロジェクトを作成
2. Webアプリを追加してFirebaseConfigを取得
3. プロジェクト設定 > 全般タブ > マイアプリから設定値をコピー
4. 上記の値を `.env` ファイルに設定（**クォートなし**）

**Firebase設定の仕組み**:
- 開発環境: `.env` ファイルから `app.config.ts` 経由で `extra.firebase` に配置
- 本番環境: EAS Build時に環境変数から自動設定
- ランタイム: `expo-constants` 経由でFirebase初期化に使用

**認証状態の永続化**:
- React Native: AsyncStorageで自動的に認証状態が永続化
- Web: ブラウザの標準ストレージを使用
- セッション情報はアプリ再起動後も保持される
- 匿名認証を使用してユーザー識別を実現

**注意**: 
- `.env` ファイルは `.gitignore` に含まれています
- 全ての必須キーが設定されていない場合、起動時にエラーが表示されます
- Firebase設定エラーは起動時のデバッグログで確認可能

### 開発サーバーの起動

```bash
# 開発モードでExpoを起動
npm run dev
# または
npx expo start

# 特定のプラットフォームで起動
npm run ios      # iOS シミュレーター
npm run android  # Android エミュレーター
npm run web      # ブラウザ（注意：3D機能制限あり）
```

### 🎮 実機での実行（推奨）

**3D機能の最適なパフォーマンスのため実機での実行を強く推奨します。**

1. **Expo Go アプリをインストール**:
   - iOS: App Store から "Expo Go" をダウンロード
   - Android: Google Play Store から "Expo Go" をダウンロード

2. **QRコードでアプリを開く**:
   - `npx expo start` を実行
   - ターミナルに表示されるQRコードをスキャン
   - または、同じWi-Fiネットワーク上でURLを直接入力

3. **開発時のホットリロード**:
   - ファイルを保存すると自動的にアプリが更新
   - エラー時はExpo Goアプリでシェイクしてデバッガーを開く

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
│   ├── CivilizationModal.tsx    # 文明追加・編集モーダル
│   └── UI/
│       ├── Screen.tsx           # 安全領域付きスクリーンラッパー
│       ├── StateBadge.tsx       # 文明状態バッジ
│       └── Toast.tsx            # トースト通知
├── lib/
│   ├── __tests__/
│   │   └── civilizationStateMachine.test.ts # セルフテスト（開発環境のみ）
│   ├── index.ts                 # ユーティリティ関数
│   ├── firebase.ts              # Firebase v11初期化・ヘルパー
│   ├── civilizationStateMachine.ts # 文明状態の決定論的評価
│   ├── dateUtils.ts             # 日付・時刻フォーマット関数
│   └── three.ts                 # Three.js設定（プレースホルダー）
├── repositories/
│   ├── index.ts                 # リポジトリエクスポート
│   ├── paths.ts                 # Firestoreパスビルダー
│   ├── planetGoalRepository.ts  # 惑星目標CRUD
│   ├── civilizationRepository.ts # 文明CRUD
│   └── progressLogRepository.ts # プログレスログCRUD
├── stores/
│   ├── index.ts                 # ストアエクスポート
│   └── useAppStore.ts           # メインZustandストア
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

## 既知の制限事項と今後の展開

### 🚧 現在の制限事項

#### MVPとしての制限
- **認証システム**: 匿名認証を使用してユーザー識別を実現（マルチユーザー対応なし）
- **連続アニメーション**: 3Dシーンは意図的にオンデマンドレンダリング（バッテリー効率重視）
- **複雑な物理演算**: シンプルな球面マーカー配置のみ
- **プッシュ通知**: リアルタイム通知機能なし

#### 技術的制限
- **Web版3D**: ブラウザでの3D機能は制限的（実機推奨）
- **大規模データ**: 100文明以上での性能未検証
- **オフライン同期**: 基本的なFirestore自動同期のみ

### 🚀 次のステップ

#### Phase 2: エンハンス機能
- [ ] **Firebase Authentication**: ユーザー登録・ログイン機能
- [ ] **文明の詳細管理**: 人口、技術レベル、リソースなどの追加属性
- [ ] **惑星環境シミュレーション**: 気候、災害、リソース競合
- [ ] **文明間相互作用**: 交易、戦争、協力関係

#### Phase 3: アドバンス機能  
- [ ] **リアルタイム更新**: WebSocketまたはFirebaseリアルタイムデータベース
- [ ] **プッシュ通知**: 重要なイベント通知
- [ ] **惑星カスタマイゼーション**: テクスチャ、地形、大気の変更
- [ ] **データエクスポート**: 文明データのCSV/JSON出力

#### Phase 4: ソーシャル機能
- [ ] **マルチプレイヤー**: 複数プレイヤーでの惑星共有
- [ ] **ランキング**: 文明発展度のグローバルランキング
- [ ] **実績システム**: 特定の目標達成でのバッジ獲得

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
