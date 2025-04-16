# my-coding-agent-2

my-coding-agent-2は、Anthropic Claudeモデルを活用したコーディングAIエージェントです。ターミナル上で動作し、ユーザーからの質問に回答する対話型AIアシスタントです。

## 特徴

- Anthropic Claude-3-7-Sonnetモデルを使用
- ターミナルインターフェースでの対話
- ファイルシステムへのアクセス機能
- テキスト応答のストリーミング表示

## インストール方法

```bash
# リポジトリのクローン
git clone https://github.com/naofumi-fujii/my-coding-agent-2.git
cd my-coding-agent-2

# 依存関係のインストール
npm install
```

## 環境設定

1. `.env`ファイルをプロジェクトのルートディレクトリに作成します:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 使用方法

```bash
# アプリケーションの起動
npm start
```

起動後、ターミナルで質問を入力すると、AIが回答します。

## 参考リンク

- コーディング AI エージェントを自作してみよう https://azukiazusa.dev/blog/build-your-own-coding-ai-agent/
