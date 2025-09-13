# StellarLog

**挑戦を記録すると、星と文明が育つ**

## コンセプト

StellarLogは、個人の挑戦を記録することで3D惑星上に文明を育てるアプリです。挑戦の進捗を記録するたびに、惑星上の文明マーカーが成長し、惑星全体が発展していきます。

### 世界観
- **星のビジョン**: あなたの目標が惑星の未来を決める
- **文明の成長**: 挑戦の記録が文明の発展を促す
- **3D惑星**: リアルタイムで変化する惑星ビューアー

## 技術スタック

- **Framework**: Expo SDK 54
- **Language**: TypeScript
- **3D Rendering**: Three.js + expo-three
- **State Management**: Zustand
- **Storage**: AsyncStorage (ローカル)

## 開発環境

### セットアップ
```bash
npm install
npx expo start
```

### 実機での実行（推奨）
1. Expo Goアプリをインストール
2. QRコードでアプリを開く
3. 3D機能は実機で最適なパフォーマンス

## プロジェクト構造

```
src/
├── screens/          # 画面コンポーネント
├── components/        # UIコンポーネント
├── lib/             # 3Dレンダリング・ユーティリティ
├── stores/          # 状態管理
└── types.ts         # 型定義
```

## 開発メモ

- **3D惑星**: 地軸15度傾斜、昼夜システム、文明マーカー
- **文明状態**: developing → decaying → ocean
- **操作**: スワイプ回転、ピンチズーム、タップ選択
- **データ**: ローカルストレージ（AsyncStorage）
