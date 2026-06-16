# DEVLOG — space-rental

モック実装から Supabase(PostgreSQL)/Prisma への DB 化の作業記録。

## アーキテクチャ
- **DB**: Supabase (PostgreSQL)。Prisma 経由でアクセス（`provider = "postgresql"`）。
  - 接続: `.env` の `DATABASE_URL`（pooler 6543）/ `DIRECT_URL`（pooler 5432）。Supabase の鍵類は `.env.local`。
  - Prisma スキーマは snake_case 実テーブルに `@@map`/`@map` でマッピング。
- **層構成**:
  - `lib/repositories/*` … Prisma クエリ（データアクセス）
  - `lib/mappers/*` … Prisma 行 → UI 型（`@/types`）へ変換
  - `app/**/actions.ts` … Server Actions（書き込み）。`revalidatePath` で再取得
  - 画面は server component で取得 → client component（`*Client.tsx`）へ props
- **認証**: 未実装。`getCurrentGuest()` / `getCurrentHost()` は「最初の行」を返す**デモ実装**。実ログイン導入時はここだけ差し替え。
- **データソース**: 旧 `@/services`(mock) は順次撤去。`@/mock` は表示ラベル/ヘルパー（statusLabel 等）と一部フォールバックのみ残存。

## DB マイグレーション（supabase/migrations、live へ直接適用）
> prisma migrate ではなく node スクリプトで `ALTER`/seed を適用（baseline ドリフト回避のため）。
- `0001_mvp_gaps.sql` — 初期ギャップ（policy 冪等化済み）
- `0002_seed.sql` — 初期 seed
- `0003_add_user_status.sql` — `users.status`（active|pending|suspended）
- `0004_add_guest_license.sql` — `guests.license`
- `0005_add_user_avatar.sql` — `users.avatar_url`（Storage `avatars` バケットと連携）
- `0006_booking_no_overlap.sql` — `bookings` の重複防止（btree_gist 排他制約）
- `0007_space_tag_category.sql` — `space_tags.category`（設備カタログのカテゴリ）
- `0008_space_pitch.sql` — `spaces.pitch_title` / `spaces.pitch_body`
- `0009_seed_space_pitch.sql` — 既存サンプルスペースの紹介文 seed
- `0010_space_min_booking_hours.sql` — `spaces.min_booking_hours`（最低利用時間）
- `0011_space_resource_classification.sql` — `spaces.resource_category` / `capacity_unit` / `attributes`（MVP は spaces 自己参照で resource 扱い）
- `0012_resource_booking_levels.sql` — `parent_space_id` による親子リソース、`bookable_level` / `booking_level`、親子重複予約防止トリガー
- `0013_host_contact_address.sql` — `hosts` に住所/緯度経度を追加（電話番号は `users.phone`）

## DB 化が完了した範囲
### ゲスト
- `/spaces` 一覧（公開=approved のみ）・`/spaces/[id]` 詳細（レビュー/表示項目/設備）
- 予約作成（Server Action、**重複防止**：アプリ層＋DB排他制約）、完了後 `/guest/bookings` へ
- `/guest/bookings` 一覧、キャンセル、レビュー投稿、レビュー済み判定
- `/me` マイページ（プロフィール表示）＋ `/me/profile/edit`（名前/メール/職種/保有資格/**写真=Storage**）
- お気に入り（`favorites`、Context+Server Action、全画面ハート連動）
- 通知（`notifications`）・本人確認 KYC（`kyc_submissions`、提出）・LINE設定（`line_connections`、連携/通知トグル）

### ホスト
- `/host/spaces` 一覧・`/host/spaces/[id]` 詳細（概要/カレンダー/設定）・`/host/spaces/new` 新規作成・削除
- 設定：名前/単価(hourly option)/定員/公開/**住所**、未保存警告
- **カレンダー**：当月・今日ハイライト・実予約/空き枠を反映（`SpaceCalendar`）
- 空き枠ルール CRUD（`availabilities`）、表示項目 CRUD（`space_fields`）
- **設備**：カタログ（`space_tags` + category）から付与、アイコン自動
- 予約一覧・承認/辞退（Server Action）
- 収益 `/host/earnings`（予約集計＋`settlements`）
- `/host/me` マイページ＋プロフィール編集（写真含む）

### 管理
- 申請審査（host/guest_applications 承認/却下）・KYC 審査・ユーザー一覧/停止/再開
- 全予約（キャンセル/返金）・スペース一覧・精算（振込実行）・監査ログ
- **監査ログ記録**：管理操作（承認/却下/キャンセル/返金/振込/停止/再開）を `audit_logs` に記録

## ナビゲーション（PC 上メニュー / モバイル 下メニュー）
- ゲスト: スペース / 予約(/guest/bookings) / 通知 / マイページ(/me)
- ホスト: スペース / 予約 / 収益 / マイページ(/host/me)
- `/host/dashboard`・`/host/calendar` は廃止（リダイレクト）。カレンダーは各スペース内に統合。

## サンプルデータ
- ホスト3人（田中/山田/鈴木）、計7スペース（公開6）。表示項目12・設備タグ24・関連13。

## 未対応 / TODO
- **A. スペース紹介文（ピッチ：タイトル＋詳細）** — 対応済み（`spaces.pitch_title` / `spaces.pitch_body`、ホスト編集、ゲスト表示）
- **B. 設備の構造化詳細**（Wi-Fi速度/SSID/パスワード、駐車台数 等）— 公開可否の扱い要設計／カテゴリ選択時の自動プリフィル
- **C. 細かい**：
  - 対応済み：最低利用時間（ホスト設定→ゲスト予約→作成時検証、保存値の読み戻し補正）、本人確認未承認ゲストの予約ブロック、スペース概要の承認待ち行クリック→承認ダイアログ、承認前のゲスト概要＋プロフィール展開、空き枠ルール編集、除外日のゲスト/ホストカレンダー反映、ゲスト詳細の公開空き状況カレンダー、日付入力の大きいカレンダーシート化、公開設定のゲスト一覧/詳細 revalidate
  - 未対応：ホスト自己紹介(bio)（Phase2）
- **Payment**（`/me/payment`）— 指示により DB 化対象外（モック）
- **認証**（実ログイン）未実装 — `getCurrentGuest/Host` を差し替え
- ゲスト評価（4.9）は集計元なしのため非表示
- 収益サマリの一部は予約集計ベース（settlements 連携は最小）

## 検証方法（参考）
- 型: `./node_modules/.bin/tsc --noEmit`
- DB 確認: `node --env-file=.env <script.mjs>`（`@prisma/client` 直叩き）。Storage 確認は `--env-file=.env --env-file=.env.local`

## 作業ログ（着手順・〜2026-06-13）
1. `0001_mvp_gaps.sql` の policy 重複エラー修正（`drop policy if exists` で冪等化）。
2. `supabase/schema.sql` を実行可能な完全版に再構築（実FK/CHECK/INDEX/RLS、依存順、文字列デフォルトのクォート）。
3. Prisma 導入整備：provider を sqlite→postgresql、`.env` を Supabase 接続テンプレ化、SQLite 残骸削除。`db pull`→PascalCase化＋snake_case `@@map`＋リレーション名整理＋enum を String 化。`lib/prisma.ts` をシングルトン化。
4. 層構成（repository / mapper / Server Action / server→client）を確立。
5. ゲスト読み取り DB化：`/spaces` 一覧、`/spaces/[id]` 詳細（レビュー/表示項目）。
6. ホスト読み取り＋予約作成：`/host/spaces`、`createBookingAction`。
7. **P1**：予約一覧の読み取りを全画面 DB化（`/guest/bookings`・`/me` 履歴・`/host/bookings`・dashboard・calendar）。booking マッパー。
8. **P2**：書き込み（キャンセル/承認・辞退/レビュー投稿）＋ お気に入りを localStorage→DB（FavoritesProvider）。
9. **P3a**：`/me` の通知・KYC・LINE設定を DB化。
10. **P3b**：`/host/spaces/[id]` 詳細/設定/削除、`/host/spaces/new` 作成、空き枠・表示項目 CRUD。
11. **P4**：管理画面一式（申請/KYC審査・ユーザー・スペース・予約取消/返金・精算・ログ）。
12. `users.status` 追加＋ユーザー停止/再開、各管理操作の **監査ログ記録**（AuditAction 拡張）。
13. プロフィール仕上げ：`guests.license`、`users.avatar_url` ＋ Supabase Storage（`avatars`）で写真アップロード。
14. ダブルブッキング防止：アプリ層チェック＋DB排他制約（`0006`）。`/me` のキャンセル予約を淡赤/画像薄め/管理ボタン無効に。
15. 予約ダイアログ：支払いボタンのモバイル崩れ修正、完了後「予約履歴を見る」で `/guest/bookings` へ。
16. **ナビ整理（ゲスト）**：`/me` をマイページ化、予約は `/guest/bookings` に集約。PC上メニュー＋モバイル下メニューのレスポンシブ化。
17. **ナビ整理（ホスト）**：スペース/予約/収益/マイページに統一。`/host/dashboard`・`/host/calendar` 廃止（リダイレクト）。`/host/earnings` 独立、`/host/me`＋プロフィール編集（写真）新設。
18. **H2** 各スペースのカレンダーを動的化（当月・今日・実予約/空き枠＝`SpaceCalendar`）。**H3** 収益を予約集計＋`settlements` で実値化。
19. スペース設定の不具合修正：公開↔ゲスト一覧連動（公開分のみ表示）、住所フィールド追加、未保存警告、カレンダー追加ボタンのモバイル崩れ。
20. サンプルデータ投入：ホスト2人×2スペース、表示項目12、設備カタログ（`space_tags.category`＝`0007`）。
21. **設備(B) v1**：カテゴリ別カタログ＋アイコン自動＋ホスト設備エディタ＋ゲスト詳細のアイコン表示。
22. **紹介文(A)**：`spaces.pitch_title`/`pitch_body`（`0008`/`0009`）。※列の DB 適用漏れで `space.findMany` が落ちる不具合 → `0008` を live に適用して復旧。
23. `DEVLOG.md` ＋ セッションメモリを作成・更新。
24. 最低利用時間の反映漏れ修正：保存は live DB の `spaces.min_booking_hours` に入っていたため、ホスト設定ページ・ゲスト詳細・予約作成検証で raw read を併用し、Prisma Client 再生成前でも最新値を使うよう補正。
25. スペース概要の「今後の予約」で承認待ち予約の行全体を選択可能にし、押すと該当予約の `ApprovalDialog`（予約リクエストの承認）を開くよう調整。
26. 空き枠ルール編集を追加：`updateAvailabilityAction` / repository update を追加し、既存ルールをインライン編集できるようにした。終了日・除外日・スペース検索の日付入力は native `type=date` をやめ、`DatePickerField` の大きいカレンダーシートへ統一。
27. 除外日と `24:00` の扱いを確認・修正：ゲスト予約カレンダーは除外日を選択不可グレー、ホストカレンダーも受付不可グレー表示に調整。Prisma の `time` 変換で `24:00` が `00:00` に見えるため、空き枠作成/更新は raw SQL で time 文字列を保存し、UI mapper では終了 `00:00` を `24:00` として補正。Harajuku Hideout は「月火 09:00-21:00（2026/06/30 除外）」＋「水木金土日 20:00-24:00」に設定済み。
28. ゲスト詳細の「予約空き状況」に公開カレンダーを追加。予約ダイアログを開く前から空き日/受付不可/予約ありを確認でき、Harajuku Hideout の `2026/06/30` 除外日もグレー表示される。
29. ゲスト側で Harajuku Hideout の 6/18 等がグレーになる問題を修正。ページ props と予約作成検証を `getUIAvailabilities()` の raw SQL 読み取りへ差し替え、DB の `24:00` を Prisma Date 変換で `00:00` に落とさず、`20:00-24:00` として扱うよう統一。
30. 承認ダイアログ Phase1：ゲスト概要カード（写真/名前/職種/本人確認/利用回数/レビュー/登録月）と「プロフィールを見る」展開を追加。Booking mapper/repository で guest.user.avatar、profession/license、KYC、過去利用回数、レビュー集計を渡すようにした。連絡先は承認前に表示しない方針。
31. 本人確認未承認ゲストの予約ブロックを追加：`isKycApproved()` を追加し、`createBookingAction` で KYC approved 以外は予約作成を拒否。ゲストのスペース詳細 CTA も未承認時は「本人確認へ」に切り替える。現在のデモゲスト `4a6ebb46-13e8-4b21-87f5-e08dc9664079` は KYC なしのため予約不可。
32. `0011`/`0012`：ResourceGroup は作らず、既存 `spaces` を MVP の resource として拡張。`resource_category` / `capacity_unit` / `attributes`、空き枠の `bookable_level`、予約の `booking_level` / `quantity` を追加。親スペース予約は子リソース、子リソース予約は親スペースをブロックする重複防止トリガーを追加。
33. ホストプロフィールに電話番号と住所を追加。電話は `users.phone`、住所は `hosts.zipcode/prefecture/city/town/building/lat/lng`。郵便番号から住所補完、都道府県/市区町村は手入力不可。ホスト写真アップロードは Server Actions `bodySizeLimit` を 8MB に設定し、アプリ側は5MB上限で検証。
34. ホスト/ゲストのプロフィール変更監査ログを追加。`name` または `phone` が変わった場合のみ `audit_logs.action = profile_update` を本人 actor で記録し、`target_type` に `host_profile:name,phone` / `guest_profile:name,phone` のように変更項目を残す。ゲストプロフィールにも電話番号編集を追加。
