import Player from '../Player.js'; // Player 클래스 경로에 맞게 조정

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    // preload()가 사라져서 코드가 매우 가벼워집니다!

    create() {
        // PreloadScene에서 미리 로드한 'playerSkin'을 그대로 사용합니다.
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.player = new Player(this, 400, 300, 'tailer');
        this.player.speed = 300; // 플레이어 속도 설정
        this.player.addItem( this.getItem('apple', 40));
        this.player.addItem( this.getItem('saw'));
        this.player.addItem( this.getItem('sword'));
        this.player.addItem( this.getItem('coin'));
        this.player.addItem( this.getItem('apple'));
        this.player.addItem( this.getItem('coin',99));
        
        this.player.addItem( this.getItem('milk'));
        this.player.addItem( this.getItem('bottle'));
        this.player.addItem( this.getItem('summerhat'));
        this.player.addItem( this.getItem('dress'));

        // 🌟 매우 중요: 메인 게임 위에 UI 씬을 오버레이로 얹어줍니다.
        this.scene.launch('UIScene');
        this.scene.launch('TooltipScene');    // 3층 (여기는 항상 켜두고 평소엔 숨김 처리)

        // 키보드 및 조이스틱 설정
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');

        this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
            x: 160, y: height-160, radius: 120,
            base: this.add.circle(0, 0, 90, 0x888888, 0.5),
            thumb: this.add.circle(0, 0, 50, 0xcccccc, 0.8),
            dir: '8dir', forceMin: 16, enable: true
        });

        //키보드 입력
        this.input.keyboard.on('keydown-I', () => {
            // 1. 게임 화면은 일시정지 (물리엔진, 타이머 등이 멈춤)
            this.scene.pause(); 
            
            // 2. 인벤토리 씬을 위에 겹쳐서 실행 (launch는 병렬 실행을 뜻함)
            // 캐릭터의 아이템 데이터(inventoryData)를 인벤토리 씬으로 넘겨줄 수 있습니다.
            this.scene.launch('InventoryScene', { items: this.player.inventory });
        });
    }

    update() {
        // (기존에 작성했던 아이소메트릭 이동 알고리즘 및 flipX 로직이 들어가는 곳)
        let dx = 0;
        let dy = 0;

        // --- 1. 키보드 입력 감지 ---
        if (this.cursors.left.isDown || this.wasd.A.isDown) dx = -1;
        else if (this.cursors.right.isDown || this.wasd.D.isDown) dx = 1;

        if (this.cursors.up.isDown || this.wasd.W.isDown) dy = -1;
        else if (this.cursors.down.isDown || this.wasd.S.isDown) dy = 1;

        // --- 2. 조이스틱 입력 감지 (키보드 입력이 없을 때 적용) ---
        if (dx === 0 && dy === 0 && this.joyStick.pointer) {
            // 조이스틱의 각도(라디안)를 받아옴
            if (this.joyStick.force > 0) {
                dx = Math.cos(this.joyStick.angle * Math.PI / 180);
                dy = Math.sin(this.joyStick.angle * Math.PI / 180);
            }
        }

        // --- 3. 아이소메트릭 벡터 변환 ---
        if (dx !== 0 || dy !== 0) {
            // 대각선 이동 속도 보정을 위해 벡터 정규화(Normalize)
            let len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;

            // Isometric 변환 공식 적용
            // 화면상 오른쪽 아래로 갈 때 캐릭터는 오른쪽을 바라봄
            let isoX =  dx;//(dx - dy); 
            let isoY = dy;//(dx + dy); // Y축은 압축되므로 0.5를 곱함

            // 최종 속도 적용
            this.player.setVelocity(isoX * this.player.speed, isoY * this.player.speed);

            // --- 4. FlipX 및 애니메이션 방향 결정 ---
            // 캐릭터 스프라이트가 기본적으로 '오른쪽'을 바라보고 있다고 가정할 때
            if (isoX > 0) {
                // 왼쪽으로 갈 때 뒤집기
                this.player.setFlipX(true);
                this.player.anims.play('walk', true);
            } else if (isoX < 0) {
                // 오른쪽으로 갈 때 원상복구
                this.player.setFlipX(false);
                this.player.anims.play('walk', true);
            }
            
            // (선택사항) 상하 이동에 따른 애니메이션 분기
            if (isoY != 0) {
                this.player.anims.play('walk', true);
                // 위를 바라보는 애니메이션 실행 (등짝)
                // this.player.anims.play('player-up', true);
            } else {
                // 아래를 바라보는 애니메이션 실행 (앞모습)
                // this.player.anims.play('player-down', true);
            }

        } else {
            // 입력이 없으면 정지
            this.player.setVelocity(0, 0);
            // 정지 애니메이션 실행
            this.player.anims.play('idle', true);
             this.player.anims.stop();
        }
    }
    getItem(id, num = -1){
        // 레지스트리에서 로드된 정적 마스터 DB 꺼내오기
        const itemDB = this.registry.get('ITEM_DATABASE');
        const baseItem = itemDB[id];
        const _num = num<0 ? Phaser.Math.Between(1, 100) : num; // 랜덤 개수 설정
        if (!baseItem) return;

        // 2. [순서 변경] 원본을 먼저 안전하게 깊은 복사합니다.
        const item = structuredClone(baseItem); 

        // 3. 복사본(item)을 대상으로 데이터를 초기화 및 추가합니다.
        if (item.type === 'foods') {
            //item.count = 1;
            item.maxFresh = 100;
            item.fresh = _num // 이제 완벽히 개별적인 랜덤 값이 유지됩니다.
        }
        if (item.count !=null) {
            if(item.count<0){
                item.count = _num;
            }else{
                item.count = 1; // 기본 개수 초기화
            }
            item.maxCount = 100; // 최대 개수 설정
        }
        // 4. 안전해진 복사본 반환
        return item;
    }
}