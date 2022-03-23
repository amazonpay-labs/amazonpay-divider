# amazonpay-divider

## amazonpay-dividerでできること
[Amazon Payで取得可能な住所情報(AddressLine1から3)](http://amazonpay-integration.amazon.co.jp/amazonpay-faq-v2/detail.html?id=QA-8)を「市区町村」「町域」「丁目・番地・号」「建物名」に分割します。

## デモ
[demo.html](https://amazonpay-labs.github.io/amazonpay-divider/demo.html)より、住所分割のイメージを確認できます。


## 利用方法
### 1.[amazonpay-divider.js](https://github.com/amazonpay-labs/amazonpay-divider/blob/main/amazonpayDivider.js)をダウンロードし、自身のサーバへ配置します。

### 2.amazonpay-divider.jsを`script`タグで読み込み、以下の方法で利用します。

```
<script src="amazonpayDivider.js"></script>

/* 住所を「市区町村」「町域」「丁目・番地・号」「建物名」に分割 */
// 引数にAmazon Pay APIで取得した住所情報のAddressLine1から3を設定します。
var address = amazonpayDivider.divideAddress(addressLine1, addressLine2, addressLine3);

var success = address.success;       // divideAddressで分割できた場合はtrue, できなかった場合はfalse
var city = address.city;                 // 市区町村     例） 目黒区
var town = address.town;                 // 町域　　　　　　　　　　　　　　　　　例） 下目黒
var streetNumber = address.streetNumber; // 丁目・番地・号 　例) 1-8-1
var building = address.building;         // 建物名　　　　　　　　　　　　　例） アルコタワー 100号室
```

## ご留意事項
* 本ページで紹介している対応案やサンプルコード（以降、本サンプル）の機能または性能に関して、明示的にも黙示的にも、法律上の瑕疵担保責任、商品性の保証および特定目的適合性の保証についての暗黙の保証を含め（ただし、これらに限定されません）、いかなる保証または表明もいたしません。
* 本サンプルは現状有姿にて提供され、利用者は自己の単独の責任で使用するものとします。
* 本サンプルは、住所情報を区分（市区町村、町域、その他）ごとに分割するものですが、利用者が入力した全ての住所を完全に期待通りに分割可能であることを保証するものではありません。
* 本サンプルの使用に起因または関連する直接的、間接的、結果的、特別、付随的、懲罰的損害賠償（営業権の喪失、事業の中断、利益もしくはデータの逸失、補償費用、コンピュータの障害もしくは故障を含みます。）を含むがこれらに限定されることなく、原因の如何を問わずおよび責任の法理にかかわらず、Amazonが当該損害の可能性につき通知を受けていた場合であっても、Amazonは、いかなる損害に対しても、責任を負いません。
* 上記を条件に、本サンプルをご利用いただけます。
