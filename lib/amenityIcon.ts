// Amenity name → Material Symbols icon. Falls back to a generic check.
const ICONS: Record<string, string> = {
  "Wi-Fi": "wifi",
  電源: "power",
  駐車場: "local_parking",
  冷暖房: "ac_unit",
  トイレ: "wc",
  エレベーター: "elevator",
  キッチン: "kitchen",
  喫煙可: "smoking_rooms",
  バリアフリー: "accessible",
  撮影用ライト: "wb_incandescent",
  背景紙: "wallpaper",
  三脚: "videocam",
  防音: "hearing",
  ホリゾント: "panorama",
  撮影機材: "photo_camera",
  シャンプー台: "shower",
  セット面: "chair",
  タオル: "dry_cleaning",
  消毒設備: "sanitizer",
  待合スペース: "weekend",
  プロジェクター: "cast",
  ホワイトボード: "edit_square",
  モニター: "desktop_windows",
  会議テーブル: "table_restaurant",
};

export function amenityIcon(name: string): string {
  return ICONS[name] ?? "check_circle";
}
