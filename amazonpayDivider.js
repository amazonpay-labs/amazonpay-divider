var amazonpayDivider = (function() {

    function _removeStateOrRegion(addressLine1) {
        var stateOrRegionRegexp = /(北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)/;
        return addressLine1.replace(stateOrRegionRegexp, '');
    }
    
    function _divideByCity(addressLines) {
        // 正規表現の順番
        // 1..+?(村山|市|町|村)市 に一致する OR　○市までが市区町村　町域に「区」が入る OR ○市までが市区町村　町域に「町」が入る
        // (田村|東村山|武蔵村山|羽村|十日町|野々市|大町|四日市|廿日市|大村|旭川|北見|富良野|伊達|石狩|南相馬|那須塩原|上越|富山|黒部|坂井|小諸|塩尻|豊川|松阪|福知山|姫路|玉野|下松|岩国|周南|田川|西海|別府|佐伯|蒲郡|鈴鹿|長浜|高槻|寝屋川|大和郡山|山口|丸亀|八代|都城|鹿児島)市
        // 2.市・郡・町・区すべて含む
        // 九戸郡洋野町種市第２２地割～第２３地割（一区、二区、三区、四区、大町、小橋、住吉町）
        // 3.○郡○町の形式で、「町」「村」などの文字を含む
        // 佐波郡玉村町|杵島郡大町町
        // 4..+?市.+?区 に一致する
        // ○郡○[町村]の中に、○市○区　を含む住所が存在するため、先に上記に一致する住所を取り除く
        // 5○郡○町　または　○郡○村
        // .+?郡.+?[町村]
        // 6.残り
        // .+?[市区町村]
        var cityRegexp = /(田村|東村山|武蔵村山|羽村|十日町|野々市|大町|四日市|廿日市|大村|旭川|北見|富良野|伊達|石狩|南相馬|那須塩原|上越|富山|黒部|坂井|小諸|塩尻|豊川|松阪|福知山|姫路|玉野|下松|岩国|周南|田川|西海|別府|佐伯|蒲郡|鈴鹿|長浜|高槻|寝屋川|大和郡山|山口|丸亀|八代|都城|鹿児島)市|佐波郡玉村町|杵島郡大町町|九戸郡洋野町|.+?市.+?区|.+?郡.+?[町村]|.+?[市区町村]/;
        var divided = _divideBy(cityRegexp, addressLines);

        if(!divided.match)
            throw new Error(addressLines + ' does not include city.');

        return {
            city: divided.match,
            townArea: divided.right
        }
    }

    function _divideByTown(addressLines) {
        var townRegexps = [
            /三ノ輪町三ノ輪/, // 豊橋市三ノ輪町三ノ輪
            /丁目(塩越|本通り|[東西南北横]町|[上下])/, // にかほ市象潟町５丁目塩越, 京都市伏見区京町８丁目横町, 十日町市本町一丁目上 など
            /[東西南北のノ][一二三四五六七八九十百千万]+丁目/, // 花巻市中北万丁目, 十日町市本町六ノ一丁目 など 
            /[上下][一二三四五六七八九十０-９0-9]丁堀?/, // 横手市上八丁 など
            /[一二三四五六七八九十百千万０-９0-9]号[地東西南北]/, // 豊川市御津町佐脇浜三号地, 豊川市御津町御幸浜一号地,上川郡東川町東１０号南 など
            /[一二三四五六七八九十百千万０-９0-9][のノ之番丁東西南北][^一二三四五六七八九十百千万０-９0-9目耕地]+/, // 二の宮, 五ノ神などの町域を抽出
            /字[^０-９0-9第]+/, // 岩手町大字五日市第１１地割５３番地３
            /[一二三四五六七八九十百千万０-９0-9]条[東西南北]?/
        ];

        for (var i=0; i < townRegexps.length; i++) {               
            var townRegexp = townRegexps[i];
            var divided = _divideBy(townRegexp, addressLines);
            if(divided.match) {
                return {
                    town: divided.left.concat(divided.match),
                    streetNumberArea: divided.right
                }
            }
        }

        return {
            town: '',
            streetNumberArea: addressLines
        }
    }

    function _divideByStreetNumber(addressLines) {
        var streetNumberRegexps = [
            /第?(([0-9０-９]+|[一二三四五六七八九十百千万]+|[ABCＡＢＣ])(丁目[東西南北]?|丁|番耕?地|番|号|地割|-|‐|ー|−|－|ノ|の)){1,3}[東西南北]?(([0-9０-９]+|[一二三四五六七八九十百千万]+)|(丁目|丁|番地|番|号){1,2})*/,
            /[0-9０-９]+/
        ];

        for (var i=0; i < streetNumberRegexps.length; i++) {               
            var streetNumberRegexp = streetNumberRegexps[i];
            var divided = _divideBy(streetNumberRegexp, addressLines);
            if(divided.match) {
                return {
                    town: divided.left, 
                    streetNumber: divided.match,
                    building: divided.right
                }
            }
        }
        
        return {
            town: addressLines,
            streetNumber: '',
            building: ''
        }
    }
    
    function _divideBy(regexp, addressLines) {
        var matches = addressLines.match(regexp);
    
        if (!matches) {
            return _response();
        }
    
        var match = matches[0];
        var index = addressLines.indexOf(match);

        return _response(addressLines.slice(0, index), match, addressLines.slice(index + match.length));

        function _response(left, match, right) {
            return {
                left: left || '',
                match: match || '',
                right: right || ''
            }
        }
    }

    return {
        divideAddress(addressLine1, addressLine2, addressLine3) {
            addressLine1 = _removeStateOrRegion(addressLine1); //都道府県名を取り除く
            addressLine2 = addressLine2 || '';
            addressLine3 = addressLine3 || '';

            try {
                var cityObj = _divideByCity(addressLine1);
                var townObj = _divideByTown(cityObj.townArea.concat(addressLine2).concat(addressLine3)); // 丁目・番地・号で正規表現を適用する前に、「の」や「ノ」を含む町名を切り取る

                var streetNumberObj = _divideByStreetNumber(townObj.streetNumberArea);

                return {
                    success: true,
                    city: cityObj.city.trim(),
                    town: townObj.town ? townObj.town.trim() : streetNumberObj.town.trim(),
                    streetNumber: townObj.town ? streetNumberObj.town.concat(streetNumberObj.streetNumber).trim() : streetNumberObj.streetNumber.trim(),
                    building: streetNumberObj.building.trim()                        
                }

            } catch (e) {
                return {
                    success: false,
                    city: addressLine1,
                    town: addressLine2,
                    streetNumber: addressLine3,
                    building: ''
                }
            }
        }
    };
})();