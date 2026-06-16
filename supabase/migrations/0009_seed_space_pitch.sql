-- ============================================================================
--  0009: seed pitch copy for existing sample spaces
--  Safe / re-runnable. Does not overwrite host-edited pitch copy.
-- ============================================================================

update public.spaces
set
  pitch_title = '自然光で作品の質感が引き立つ、代官山の上質なアトリエ',
  pitch_body = '大きな窓からやわらかな光が入る、撮影や少人数ワークショップに向いた空間です。家具は移動しやすく、商品撮影、ポートレート、打ち合わせまで用途に合わせて整えられます。'
where name = 'Sunset Atelier'
  and pitch_title is null
  and pitch_body is null;

update public.spaces
set
  pitch_title = '眺望と静けさを両立した、高層階のミニマルスペース',
  pitch_body = '余白のある内装で、オンライン配信や小規模な商談にも使いやすい個室です。夕方以降は夜景を背景にした撮影にも向いています。'
where name = 'Minimalist Lab'
  and pitch_title is null
  and pitch_body is null;

update public.spaces
set
  pitch_title = '天井高を活かした、展示と撮影に強いロフト空間',
  pitch_body = '代官山の落ち着いたエリアにある、開放感のあるロフトです。自然光と高さを活かした撮影、少人数の展示、ワークショップに使いやすい余白があります。'
where name = 'Daikanyama Loft'
  and pitch_title is null
  and pitch_body is null;

update public.spaces
set
  pitch_title = '音と光を整えやすい、青山の撮影スタジオ',
  pitch_body = '防音仕様の室内に撮影用ライトを常設しています。動画収録、商品撮影、ポートレート撮影まで、準備時間を抑えてすぐに使えるスタジオです。'
where name = 'Aoyama Studio'
  and pitch_title is null
  and pitch_body is null;

update public.spaces
set
  pitch_title = '美容師がすぐに施術を始められる中目黒シェアサロン',
  pitch_body = 'シャンプー台とセット面を備えた、美容室向けのシェアサロンです。スポット利用やフリーランス美容師の定期利用に向いています。'
where name = 'Nakameguro Salon'
  and pitch_title is null
  and pitch_body is null;

update public.spaces
set
  pitch_title = '打ち合わせに必要な設備がそろう、駅近の会議室',
  pitch_body = '恵比寿駅から徒歩圏内で、プロジェクターとホワイトボードを備えた会議室です。商談、チームミーティング、資料レビューに使いやすい実用的な空間です。'
where name = 'Ebisu Meeting'
  and pitch_title is null
  and pitch_body is null;
