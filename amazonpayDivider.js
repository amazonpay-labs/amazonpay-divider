var amazonpayDivider = (function () {
    if (!Array.prototype.find) {
        Array.prototype.find = function (f) {
            return this.reduce(function (pre, cur) {
                if (pre !== null) return pre;
                return f(cur) ? cur : null;
            }, null);
        }
    }

    if (!String.prototype.startsWith) {
        Object.defineProperty(String.prototype, 'startsWith', {
            value: function (search, rawPos) {
                var pos = rawPos > 0 ? rawPos | 0 : 0;
                return this.substring(pos, pos + search.length) === search;
            }
        });
    }

    if (!(window.fetch || window.Request)) {
        window.Request = function (url, headers) {
            this.url = url;
            this.headers = headers || {};
        }

        window.fetch = function () {
            return function (request) {
                var funcs = [];
                var result = null;
                var catchFunc = null;
                function thenLoop() {
                    var f = funcs.shift();
                    if (f) {
                        try {
                            result = f(result);
                            setTimeout(thenLoop, 0);
                        } catch (e) {
                            if (catchFunc) catchFunc(e);
                            else console.log(e);
                        }
                    }
                }
                setTimeout(function () {
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", request.url);
                    xhr.send();
                    xhr.onload = function () {
                        result = {
                            ok: true,
                            text: function () { return xhr.response; }
                        };
                        setTimeout(thenLoop, 0);
                    };
                }, 0);
                return {
                    then: function (f) {
                        funcs.push(f);
                        return this;
                    },
                    catch: function (f) {
                        catchFunc = f;
                        return this;
                    }
                }
            }
        }();
    }

    var kanjiToNum = function () {
        var prime_table = { "０": 0, "〇": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9 };
        var sub_table = { "十": 10, "百": 100, "千": 1000 };
        var unit_table = { "万": 10000, "億": 100000000 };

        var primesReg = new RegExp("[" + Object.keys(prime_table).join('') + "]", "g");
        var unitsReg = new RegExp("[" + Object.keys(sub_table).concat(Object.keys(unit_table)).join('') + "]");
        return function (kanji) {
            if (unitsReg.test(kanji)) {
                var obj = Array.prototype.reduce.call(kanji, function (o, cur) {
                    var r;
                    if (r = prime_table[cur]) {
                        o.prime = r;
                    } else if (r = sub_table[cur]) {
                        o.subtotal += (o.prime || 1) * r;
                        o.prime = 0;
                    } else if (r = unit_table[cur]) {
                        o.total += (o.subtotal + o.prime) * r;
                        o.subtotal = o.prime = 0;
                    }
                    return o;
                }, { total: 0, subtotal: 0, prime: 0 });
                return "" + (obj.total + obj.subtotal + obj.prime);
            } else {
                return kanji.replace(primesReg, function (s) {
                    return prime_table[s];
                });
            }
        }
    }();

    function convertHalfWidthChar(str) {
        return str.replace(
            /[〇一二三四五六七八九十百千万]+/g, function (s) {
                return kanjiToNum(s);
            }).replace(/[０-９]/g, function (s) {
                return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
            }).replace(/丁目[東西南北]?|丁|番耕?地|番|号|地割|-|‐|ー|−|－|―|ｰ|ノ|の/g, '-').replace(/-$/, '');
    }

    function convertProps(obj) {
        for (var p in obj) {
            var v = obj[p];
            if (typeof (v) === "string") obj[p] = v.trim();
            else if (Array.isArray(v)) obj[p] = v.map(function (e) { return e.trim() }).join('');

            if (p === 'streetNumber')
                obj[p] = convertHalfWidthChar(obj[p]);
        }
        return obj;
    }

    DivideAddressHelper = function (addressLine1, addressLine2, addressLine3) {
        this._addressLine1 = addressLine1;
        this._addressLine2 = addressLine2;
        this._addressLine3 = addressLine3;
    }

    DivideAddressHelper.prototype.divide = function (callback) {
        var that = this;
        var addressLine1 = _removeStateOrRegion(that._addressLine1); //都道府県名を取り除く
        var addressLine2 = that._addressLine2 || '';
        var addressLine3 = that._addressLine3 || '';

        try {
            var streetNumber = _streetNumber();
            var result = streetNumber.divideIfSpecialCases(addressLine1, addressLine2, addressLine3);
            if (result) {
                callback(convertProps(result));
                return;
            }

            var cityObj = _divideByCity(addressLine1);
            var townObj = _divideByTown(cityObj.townArea.concat(addressLine2)); // 丁目・番地・号で正規表現を適用する前に、「の」や「ノ」を含む町名を切り取る

            var streetNumberObj = streetNumber.divide(townObj.streetNumberArea);

            callback(convertProps({
                success: true,
                city: cityObj.city,
                town: townObj.town || streetNumberObj.town,
                streetNumber: townObj.town ? [streetNumberObj.town, streetNumberObj.streetNumber] : streetNumberObj.streetNumber,
                building: [streetNumberObj.building, addressLine3]
            }));

        } catch (e) {
            callback(convertProps({
                success: false,
                city: addressLine1,
                town: '',
                streetNumber: addressLine2,
                building: addressLine3
            }));
        }

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

            if (!divided.match)
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
                /[上下][一二三四五六七八九十]丁堀?/, // 横手市上八丁 など
                /[一二三四五六七八九十百千万０-９0-9]号[地東西南北]/, // 豊川市御津町佐脇浜三号地, 豊川市御津町御幸浜一号地,上川郡東川町東１０号南 など
                /[一二三四五六七八九十百千万０-９0-9][のノ之番丁東西南北][^一二三四五六七八九十百千万０-９0-9目耕地館 　]+/, // 二の宮, 五ノ神などの町域を抽出
                /字[^０-９0-9第]+/, // 岩手町大字五日市第１１地割５３番地３
                /[一二三四五六七八九十百千万０-９0-9]条[東西南北]?/
            ];

            for (var i = 0; i < townRegexps.length; i++) {
                var townRegexp = townRegexps[i];
                var divided = _divideBy(townRegexp, addressLines);
                if (divided.match) {
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

        function _streetNumber() {
            var chrome = '[一二三四五六七八九十0-9０-９]{1,4}([-‐ー−－―ｰ一ノの]|丁目[東西南北]?)';

            var format1 = '第?(([一二三四五六七八九十百千万0-9０-９]+|[ABCＡＢＣ])(丁目[東西南北]?|丁|番耕?地|番|号|地割|-|‐|ー|−|－|―|ｰ|ノ|の)){1,3}[東西南北]?(([0-9０-９]+|[一二三四五六七八九十百千万]+)|(丁目|丁|番地|番|号地?|-|‐|ー|−|－|―|ｰ|ノ|の){1,2})*';
            var format2 = chrome + '([0-9０-９]{0,4}番地?[0-9０-９]{0,4}号?([-‐ー−－―ｰ一ノの][0-9０-９]{1,4}){0,2}|([0-9０-９]{1,4}[-‐ー−－―ｰ一ノの]){0,2}[0-9０-９]{1,4}号?)';
            var format3 = '[0-9０-９]+';

            /** addressLine1のsuffixが丁目の場合、divide */
            function _divideIfSpecialLine1(addressLine1, addressLine2, addressLine3) {
                var suffix = _endsWith(addressLine1);
                if (!suffix.match) return null;

                var cityObj = _divideByCity(suffix.left);
                return {
                    success: true,
                    city: cityObj.city,
                    town: cityObj.townArea,
                    streetNumber: suffix.match,
                    building: [addressLine2, addressLine3]
                };
            }

            /** addressLine2のprefixが丁目の場合、divide */
            function _divideIfSpecialLine2(addressLine1, addressLine2, addressLine3) {
                var prefix = _startsWith(addressLine2);
                if (!prefix.match) return null;

                var cityObj = _divideByCity(addressLine1);
                var chromeObj = _divideByChrome(cityObj.townArea.trim()); // addressLine1に丁目までを記述する住所に対応
                return {
                    success: true,
                    city: cityObj.city,
                    town: chromeObj.match ? chromeObj.left : cityObj.townArea, // addressLine1に丁目までを記述する場合、丁目を取り除きtownとする
                    streetNumber: [chromeObj.match, prefix.match],
                    building: [prefix.right, addressLine3]
                };
            }

            function _startsWith(addressLine) {
                return _divideBy('^' + format2, addressLine);
            }

            function _endsWith(addresLine) {
                var matchedFormat2 = _divideBy(format2 + '$', addresLine);
                if (matchedFormat2.match) return matchedFormat2;

                var matchedFormat3 = _divideBy(format3 + '$', addresLine);
                var NOT_FOUND = matchedFormat3.left.search(format3) === -1;
                if (matchedFormat3.match && NOT_FOUND) { //目黒区下目黒10 アルコタワー100 のような住所の場合、100を丁目・番地と認識する恐れがあるため
                    return matchedFormat3;
                }

                return {
                    match: ''
                }
            }

            function _divideByChrome(addressLine) {
                return _divideBy(chrome, addressLine);
            }

            return {
                divideIfSpecialCases: function (addressLine1, addressLine2, addressLine3) {
                    return _divideIfSpecialLine1(addressLine1, addressLine2, addressLine3)
                        || _divideIfSpecialLine2(addressLine1, addressLine2, addressLine3);
                },
                divide: function (addressLines) {
                    var streetNumberRegexps = [
                        format1, format2, format3
                    ];
                    var roomNumberRegexps = /[0-9０-９]+(号[棟室]|番館)/;
                    var roomDivided = _divideBy(roomNumberRegexps, addressLines);

                    var streetNumerLines = roomDivided.match ? roomDivided.left : addressLines;

                    for (var i = 0; i < streetNumberRegexps.length; i++) {
                        var streetNumberRegexp = streetNumberRegexps[i];
                        var divided = _divideBy(streetNumberRegexp, streetNumerLines);
                        if (divided.match) {
                            return {
                                town: divided.left,
                                streetNumber: divided.match,
                                building: divided.right.concat(roomDivided.match).concat(roomDivided.right)
                            }
                        }
                    }

                    if (roomDivided.match) {
                        var index = addressLines.indexOf(roomDivided.match);
                        return {
                            town: addressLines.slice(0, index),
                            streetNumber: '',
                            building: roomDivided.match.concat(roomDivided.right)
                        }
                    }

                    return {
                        town: addressLines,
                        streetNumber: '',
                        building: ''
                    }
                }
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
    }

    DivideNameHelper = function (lastName, firstName) {
        this._lastName = lastName;
        this._firstName = firstName;
        this._initialUserName = lastName.slice(0, 1);
    }

    DivideNameHelper.prototype.divide = function (findAction) {
        var INITIAL_FILE = 'https://d3e3b7ii96fk5l.cloudfront.net/amazonpay-divider/InitialIndex.csv',
            LASTNAMES_FILE = 'https://d3e3b7ii96fk5l.cloudfront.net/amazonpay-divider/lastNames.csv',
            ROW_BYTES = 32; // LASTNAMES_FILE一行分のバイト数

        var that = this;
        try {
            _searchInitial(
                _findLastName
            );
        } catch (e) {
            console.error(e);
            _executeFindAction(that._lastName, '', that._firstName);
        }

        function _executeFindAction(lastName, lastNamePronunciation, firstName) {
            findAction({
                lastName: lastName,
                lastNamePronunciation: lastNamePronunciation,
                firstName: firstName
            });
        }

        function _searchInitial(found) {
            _fetchInitials(function (text) {
                var initialBytes = text.split('\n').find(function (line) { return line.split(',')[0] == that._initialUserName });

                if (!initialBytes)
                    throw new Error('InitialLastName does not found.');

                var startBytes = Number(initialBytes.split(',')[1]);
                // 小が先頭につく名字が最も多く1076件存在するため、バッファ込みで1100件を取得
                var start = startBytes - ROW_BYTES * 3;
                found(start >= 0 ? start : 0, startBytes + ROW_BYTES * 1100);
            });
        }

        function _findLastName(start, end) {
            _fetchLastNames(start, end, function (text) {
                _getName(text);
            });
        }

        function _getName(text) {
            var longestLastName = _getLongestLastName(text, that._lastName);
            if (longestLastName.kanji) {
                // 姓名分割には成功したが、姓の読みを取得できなかった　例)lastName:森 firstName:久美子と分割できたが、longestNameが森久の場合
                if (that._firstName && longestLastName.kanji != that._lastName) {
                    _executeFindAction(that._lastName, '', that._firstName);
                    return;
                }

                that._firstName = that._firstName || that._lastName.replace(longestLastName.kanji, '');
                _executeFindAction(longestLastName.kanji, longestLastName.pronunciation, that._firstName);
                return;
            }

            // 姓名分割には成功したが、姓の読みを取得できなかった
            if (that._firstName) {
                _executeFindAction(that._lastName, '', that._firstName);
                return;
            }

            throw new Error('lastName does not exist in the lastNames.');
        }

        function _fetchInitials(nextAction) {
            _fetch(INITIAL_FILE, nextAction);
        }

        function _fetchLastNames(start, end, nextAction) {
            _fetch(LASTNAMES_FILE, nextAction, {
                headers: {
                    'Range': 'bytes=' + start + '-' + end
                }
            });
        }

        function _fetch(url, callback, headers) {
            var request = headers ? new Request(url, headers) : new Request(url);

            window.fetch(request)
                .then(function (res) {
                    if (!res.ok) {
                        console.error('response.status:', res.status);
                        throw new Error(res.statusText);
                    }
                    return res.text();
                })
                .then(function (text) {
                    callback(text);
                }).catch(function (e) {
                    console.error(e);
                    _executeFindAction(that._lastName, '', that._firstName);
                });
        }

        function _getLongestLastName(text, lastName) {
            var br = '\n';
            var start = text.indexOf(br) + 1;
            var count = text.lastIndexOf(br) - start;
            var lastNamesText = text.substr(start, count); // 改行で切れていない可能性があるため、CSVファイルの改行を探す

            if (!lastNamesText) {
                throw new Error('lastNamesText does not found.');
            }

            var lastNames = lastNamesText.split(br).reduce(function (pre, cur, index) {
                var nameSet = cur.split(',');
                pre[index] = {
                    kanji: nameSet[0],
                    pronunciation: nameSet[1]
                }
                return pre;
            }, []);

            return lastNames.reduce(function (pre, cur) {
                return lastName.startsWith(cur.kanji) && cur.kanji.length >= pre.kanji.length ? cur : pre
            }, {
                kanji: '',
                pronunciation: ''
            });
        }
    }

    return {
        divideAddress: function (addressLines, callback) {
            new DivideAddressHelper(addressLines.addressLine1, addressLines.addressLine2, addressLines.addressLine3).divide(callback);
        },
        divideName: function (userName, callback) {
            // 全角半角スペースで分割する
            var name = userName.trim().replace(/\u3000+/g, ' ').replace(/\x20+/g, ' ').split(' ');
            var lastName = name.shift();
            var firstName = name.join(' ');
            new DivideNameHelper(lastName, firstName).divide(callback);
        }
    };
})();