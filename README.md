# amazonpay-divider

## amazonpay-dividerでできること
* [Amazon Payで取得可能な名前情報(shippingAddressのName また はbillingAddressのName)](http://amazonpay-integration.amazon.co.jp/amazonpay-faq-v2/detail.html?id=QA-8)を「姓」「名」に分割します。また、「姓」の代表的な読みを取得できます。
* [Amazon Payで取得可能な住所情報(AddressLine1から3)](http://amazonpay-integration.amazon.co.jp/amazonpay-faq-v2/detail.html?id=QA-8)を「市区町村」「町域」「丁目・番地・号」「建物名」に分割します。
* 「丁目・番地・号」は、半角数字と半角ハイフンに自動変換します。（例. 「十三丁目四十三番地１ー二三」と登録されている場合、「13-43-1-23」へ変換）

## デモ
[demo.html](https://amazonpay-labs.github.io/amazonpay-divider/demo.html)より、名前・住所分割のイメージを確認できます。


## 利用方法
### 1.[amazonpay-divider.js](https://github.com/amazonpay-labs/amazonpay-divider/blob/main/amazonpayDivider.js)をダウンロードし、自身のサーバへ配置します。

### 2.amazonpay-divider.jsを`script`タグで読み込み、以下の方法で利用します。

```
<script src="amazonpayDivider.js"></script>
<script>
/* 名前を「姓」「名」に分割 */
// 引数に、Amazon Pay APIで取得した名前情報（shippingAddressのName また はbillingAddressのName）　と　分割後の処理を実装します。
amazonpayDivider.divideName(nameLine, function(divided) {
    var lastName = divided.lastName;                           // 姓　　　例）山田
    var lastNamePronunciation = divided.lastNamePronunciation; // 姓読み　例）やまだ
    var firstName = divided.firstName;                         // 名　　　例）太郎
});

/* 住所を「市区町村」「町域」「丁目・番地・号」「建物名」に分割 */
// 引数に、Amazon Pay APIで取得した住所情報（AddressLine1から3）　と　分割後の処理を実装します。
amazonpayDivider.divideAddress({
    addressLine1: AddressLine1, // Amazon Pay APIで取得したAddressLine1 を設定
    addressLine2: AddressLine2, // Amazon Pay APIで取得したAddressLine2 を設定
    addressLine3: AddressLine3  // Amazon Pay APIで取得したAddressLine3 を設定
}, function(divided) {
    var success = divided.success;       　　 // divideAddressで分割できた場合はtrue, できなかった場合はfalse
    var city = divided.city;                 // 市区町村　　　　例） 目黒区
    var town = divided.town;                 // 町域　　　　　　例） 下目黒
    var streetNumber = divided.streetNumber; // 丁目・番地・号　例) 1-8-1
    var building = divided.building;         // 建物名　　　　　例） アルコタワー 100号室
});
</script>
```

## ご留意事項
* 本ページで紹介している対応案やサンプルコード（以降、本サンプル）は、利用者の便宜のために参考情報として提供されるものであり、その機能または性能に関して、明示的にも黙示的にも、商品性の保証および特定目的適合性の保証についての暗黙の保証を含め（ただし、これらに限定されません）、いかなる保証または表明もいたしません。
* 本サンプルは現状有姿にて提供され、利用者は自己の単独の責任で使用するものとします。
* 本サンプルは、名前情報を区分（姓、名）ごと、住所情報を区分（市区町村、町域、その他）ごとに分割するものですが、利用者が入力した全ての名前または住所を完全に期待通りに分割可能であることを保証するものではありません。
* 本サンプルの使用に起因または関連する直接的、間接的、結果的、特別、付随的、懲罰的損害賠償（営業権の喪失、事業の中断、利益もしくはデータの逸失、補償費用、コンピュータの障害もしくは故障を含みます。）を含むがこれらに限定されることなく、原因の如何を問わずおよび責任の法理にかかわらず、Amazonが当該損害の可能性につき通知を受けていた場合であっても、Amazonは、いかなる損害に対しても、責任を負いません。
* なお、本サンプルの作成にあたっては、下記Website等を参考と致しました。
* [mecab-ipadic-neologdの辞書のうち名字データ](https://github.com/neologd/mecab-ipadic-neologd/releases/) (retrieved on 2022/4/20)
* [人名エントリーデータ](https://github.com/neologd/mecab-ipadic-neologd/blob/master/COPYING#L49) (retrieved on 2022/4/20)
* [名字辞典](https://myoji.jitenon.jp/info/03.php) retrieved on 2022/4/20