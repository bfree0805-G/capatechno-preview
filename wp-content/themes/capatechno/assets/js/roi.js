/**
 * 導入効果の試算（GAPMANページ「御社の条件で計算してみてください」）
 *
 * 計算式：年間の測定箇所数 × 短縮時間（分）÷ 60 × 作業人数 × 作業単価（円／人・時）
 *   hours       … 作業1回あたりの合計の短縮時間（時間／年）
 *   personHours … 作業人数をかけた延べ時間（人時／年）
 *   yen         … 削減額（円／年）
 * 入力が空・マイナス・数字以外のときは 0 として扱う。
 * テスト（tests/feedback-0914.test.mjs）からも同じファイルを読んで確かめている。
 */
function ctRoi(input) {
  var num = function (v) { var x = parseFloat(v); return isFinite(x) && x > 0 ? x : 0; };
  var hours = num(input.points) * num(input.minutes) / 60;
  var personHours = hours * num(input.people);
  return { hours: hours, personHours: personHours, yen: Math.round(personHours * num(input.wage)) };
}
