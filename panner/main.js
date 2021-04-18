/*
#[playbgm]
:group
オーディオ関連

:title
BGMの再生(パンニング付き)

:exp
BGMを再生します。
[playbgm]タグにstereoパラメータを追加で指定することで
左右にパンニングさせることができます。
[playse]タグは内部で[palybgm]の処理を呼び出しているので、
[playse]タグでもstereoパラメータを指定すれば、
同様に音をパンニングさせることができます。

:sample
[playbgm storage="hogehoge.ogg" stereo=1]
※hogehoge.oggを右chから再生する

:param
stereo=音像定位(パンニング)。例）-1:左 -0.75:左斜め前 0:センター 0.75:右斜め前 1:右
rate=再生速度。例)0.5 ~ 4.0
volume=再生音量。例）0.0 ~ 1.0

x=疑似バイノーラルにおける音源位置x座標
y=疑似バイノーラルにおける音源位置y座標
z=疑似バイノーラルにおける音源位置z座標

#[end]
*/
(function(){
    var playbgm = {
        vital : ["storage"],

        pm : {
            loop : "true",
            storage : "",
            fadein : "false",
            time : 2000,
            volume : "",
            buf:"0",
            target : "bgm", //"bgm" or "se"

            sprite_time:"", //200-544

            html5:"false",

            click : "false", //音楽再生にクリックが必要か否か
            stop : "false", //trueの場合自動的に次の命令へ移動しない。ロード対策

            stereo: 0,   // パニング  -1:左 0:センター 1:右
            rate: 1.0,   // 再生速度 0.5~4.0 で指定。1.0が等速
            volume: 1.0,  // 音量 1:変化なし 0.5:半分

            x: 0.0, // 疑似バイノーラルにおける音源位置x座標(左右軸)
            y: 0.0, // 疑似バイノーラルにおける音源位置y座標(天地軸)
            z: 0.0  // 疑似バイノーラルにおける音源位置z座標(前後軸)
        },

        start : function(pm) {

            var that = this;

            if (pm.target == "bgm" && that.kag.stat.play_bgm == false) {
                that.kag.ftag.nextOrder();
                return;
            }

            if (pm.target == "se" && that.kag.stat.play_se == false) {
                that.kag.ftag.nextOrder();
                return;
            }

            //スマホアプリの場合
            if ($.userenv() != "pc") {

                this.kag.layer.hideEventLayer();

                if (this.kag.stat.is_skip == true && pm.target == "se") {

                    that.kag.layer.showEventLayer();
                    that.kag.ftag.nextOrder();

                } else {

                    //スマホからのアクセスで ready audio 出来ていない場合は、クリックを挟む
                    if(this.kag.tmp.ready_audio == false){

                        $(".tyrano_base").on("click.bgm", function() {

                            that.kag.readyAudio();
                            that.kag.tmp.ready_audio = true;
                            that.play(pm);
                            $(".tyrano_base").off("click.bgm");

                        });

                    }else{

                        that.play(pm);

                    }

                }

            } else {

                if(this.kag.tmp.ready_audio == false){

                    $(".tyrano_base").on("click.bgm", function() {

                        that.kag.readyAudio();
                        that.kag.tmp.ready_audio = true;
                        that.play(pm);
                        $(".tyrano_base").off("click.bgm");

                    });

                }else{
                    that.play(pm);
                }


            }

        },

        play : function(pm) {

            var that = this;

            var target = "bgm";

            if (pm.target == "se") {
                target = "sound";
                this.kag.tmp.is_se_play = true;

                //指定されたbufがボイス用に予約されてるか否か
                if(this.kag.stat.map_vo["vobuf"][pm.buf]){
                    this.kag.tmp.is_vo_play = true;
                }

                //ループ効果音の設定

                if(!this.kag.stat.current_se){
                    this.kag.stat.current_se = {};
                }

                if(pm.stop == "false") {
                    if(pm.loop=="true"){
                        this.kag.stat.current_se[pm.buf] = pm;
                    }else{
                        if(this.kag.stat.current_se[pm.buf]){
                            delete this.kag.stat.current_se[pm.buf];
                        }
                    }
                }

            }else{
                this.kag.tmp.is_audio_stopping = false;
                this.kag.tmp.is_bgm_play = true;
            }

            var volume = 1;

            if (pm.volume !== "") {
                volume = parseFloat(parseInt(pm.volume) / 100);
            }

            var ratio = 1;

            //デフォルトで指定される値を設定
            if (target === "bgm") {

                if (typeof this.kag.config.defaultBgmVolume == "undefined") {
                    ratio = 1;
                } else {
                    ratio = parseFloat(parseInt(this.kag.config.defaultBgmVolume) / 100);
                }

                //bufが指定されていて、かつ、デフォルトボリュームが指定されている場合は
                if(typeof this.kag.stat.map_bgm_volume[pm.buf] !="undefined"){
                    ratio = parseFloat(parseInt(this.kag.stat.map_bgm_volume[pm.buf])/100);
                }


            } else {

                if (typeof this.kag.config.defaultSeVolume == "undefined") {
                    ratio = 1;
                } else {
                    ratio = parseFloat(parseInt(this.kag.config.defaultSeVolume) / 100);
                }

                //bufが指定されていて、かつ、デフォルトボリュームが指定されている場合は
                if(typeof this.kag.stat.map_se_volume[pm.buf] != "undefined"){
                    ratio = parseFloat(parseInt(this.kag.stat.map_se_volume[pm.buf])/100);
                }

            }

            volume *= ratio;

            var storage_url = "";

            var browser = $.getBrowser();
            var storage = pm.storage;

            //ogg m4a を推奨するための対応 ogg を m4a に切り替え
            //mp3 が有効になっている場合は無視する
            if (this.kag.config.mediaFormatDefault != "mp3") {
                if (browser == "msie" || browser == "safari" || browser=="edge") {
                    storage = $.replaceAll(storage, ".ogg", ".m4a");
                }
            }

            if ($.isHTTP(pm.storage)) {
                storage_url = storage;
            } else {
                if(storage!=""){
                    storage_url = "./data/" + target + "/" + storage;
                }else{
                    storage_url ="";
                }
            }

            //音楽再生
            var audio_obj =null ;

            var howl_opt = {

                src: storage_url,
                volume:(volume),
                onend:(e)=>{
                    //this.j_btnPreviewBgm.parent().removeClass("soundOn");
                }

            };

            //HTML5 audioを強制する
            if (pm.html5 == "true") {
                howl_opt["html5"] = true;
            }

            //スプライトが指定されている場合
            if(pm.sprite_time!=""){

                let array_sprite = pm.sprite_time.split("-");
                let sprite_from = parseInt($.trim(array_sprite[0]));
                let sprite_to = parseInt($.trim(array_sprite[1]));
                let duration = sprite_to - sprite_from;

                howl_opt["sprite"] = {"sprite_default":[sprite_from, duration, $.toBoolean(pm.loop) ]}

            }

            audio_obj = new Howl(howl_opt);

            if (pm.loop == "true") {
                audio_obj.loop(true);
            }else{
                audio_obj.loop(false);
            }

            if (target === "bgm") {

                if(this.kag.tmp.map_bgm[pm.buf]){
                    this.kag.tmp.map_bgm[pm.buf].unload();
                }

                this.kag.tmp.map_bgm[pm.buf] = audio_obj;
                that.kag.stat.current_bgm = storage;
                that.kag.stat.current_bgm_vol = pm.volume;
                that.kag.stat.current_bgm_html5 = pm.html5;


            } else {
                //効果音の時はバッファ指定
                //すでにバッファが存在するなら、それを消す。
                if(this.kag.tmp.map_se[pm.buf]){
                    this.kag.tmp.map_se[pm.buf].pause();
                    this.kag.tmp.map_se[pm.buf].unload();
                    delete this.kag.tmp.map_se[pm.buf] ;
                }

                this.kag.tmp.map_se[pm.buf] = audio_obj;

            }

            /*
             * 拡張箇所ここから
             */

            // ステレオパンニング指定 -1:左 0:センター 1:右
            audio_obj.stereo(parseFloat(pm.stereo));

            // 再生速度指定 0.5 ~ 4.0 はみ出た場合は下限か上限に合わせる
            audio_obj.rate(parseFloat(pm.rate));

            // 再生音量指定 0.0 ~ 1.0
            audio_obj.volume(parseFloat(pm.volume));

            // 疑似バイノーラル化。パラメータが初期値の場合はとばす
            if(Number(pm.x) != Number(0.0) || Number(pm.y) != Number(0.0) || Number(pm.z) != Number(0.0)){
                // x:左右軸 y:天地軸 z:前後軸
                audio_obj.pos(Number(pm.x), Number(pm.y), Number(pm.z));
            }

            /*
             * 拡張箇所ここまで
             */

            audio_obj.once("play",function(){
                that.kag.layer.showEventLayer();
                if (pm.stop == "false") {
                    that.kag.ftag.nextOrder();
                }
            });

            if(pm.sprite_time!==""){
                audio_obj.play("sprite_default");
            }else{
                audio_obj.play();
            }

            if (pm.fadein == "true") {

                audio_obj.fade(0, volume, parseInt(pm.time));

            }

            //再生が完了した時
            if(pm.loop!="true"){

                audio_obj.on("end",function(e){

                    if (pm.target == "se") {

                        that.kag.tmp.is_se_play = false;
                        that.kag.tmp.is_vo_play = false;

                        if(that.kag.tmp.is_se_play_wait == true){
                            that.kag.tmp.is_se_play_wait = false;
                            that.kag.ftag.nextOrder();

                        }else if(that.kag.tmp.is_vo_play_wait==true){
                            that.kag.tmp.is_vo_play_wait = false;
                            setTimeout(function(){
                                that.kag.ftag.nextOrder();
                            },500);
                        }

                    }else if(pm.target == "bgm") {

                        that.kag.tmp.is_bgm_play = false;

                        if(that.kag.tmp.is_bgm_play_wait == true){
                            that.kag.tmp.is_bgm_play_wait = false;
                            that.kag.ftag.nextOrder();
                        }

                    }
                });
            }

            this.kag.ftag.nextOrder();
        }
    };

    TYRANO.kag.ftag.master_tag.playbgm = object(playbgm);
    TYRANO.kag.ftag.master_tag.playbgm.kag = TYRANO.kag;
})();
