# Panner: TyranoScriptプラグイン

## 概要
Pannerは[TyranoScript](https://tyrano.jp/)で音源のパンニングを実現するプラグインです。
既存のタグである[playbgm][playse]に追加のパラメータを指定するだけで、
音源データを加工することなく左右どちらかから聞こえるようにすることができます。

## 対応環境
TyranoScript Ver5.00

※上記以外の環境では未検証です

## 導入方法
導入したいプロジェクトの`data\others\plugin`フォルダ内にダウンロードした`panner`フォルダを配置してください。
`data\others\plugin`フォルダが存在しない場合は作成してください。

次に`data/scenario/first.ks`内でプラグインをロードします。
`[plugin name=panner]`と記述してください。

```first.ks
[title name="ティラノスクリプト解説"]
[stop_keyconfig]

@call storage="tyrano.ks"

;ここにプラグインをロードする記述
[plugin name=panner]

@layopt layer="message" visible=false

[hidemenubutton]

@jump storage="title.ks"

[s]
```

## 使用方法
### 使用方法
[playbgm]または[playse]タグで`stereo`パラメータを-1から1までの浮動小数点で指定します。
-1で音像定位が最大限左によります。1は逆に最大限右です。

-1:左 -0.75:左斜め前 0:センター 0.75:右斜め前 1:右 …といったぐあいです。

stereoパラメータは必須ではありません。
指定しなかった場合には`stereo=0`とみなされ、通常の音の再生と同様となります。

|パラメータ|必須|解説|
| ---- | ---- | ---- |
|stereo|×|音像定位を-1以上1以下の浮動小数点で指定|

### 使用例
```sample.ks
;タグの書き方サンプル。[playse]タグでも同様

[playbgm storage="hogehoge.ogg" stereo=-1]    ;BGMを左から再生
[playbgm storage="hogehoge.ogg" stereo=-0.75] ;BGMを左斜め前から再生

[playbgm storage="hogehoge.ogg"]              ;通常のBGM再生(正面から再生)
[playbgm storage="hogehoge.ogg" stereo=0]     ;通常のBGM再生(正面から再生)

[playbgm storage="hogehoge.ogg" stereo=0.75]  ;BGMを右斜め前から再生
[playbgm storage="hogehoge.ogg" stereo=1]     ;BGMを右から再生
```

## その他
### リリースノート
- 2021/04/16 ver.1.0.0 公開

### ロードマップ
- 疑似バイノーラル化に対応予定 時期未定
- ダミーヘッドマイク式の魔法陣による方位指定に対応予定 時期未定