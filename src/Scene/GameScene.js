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
        this.offsetX = 0;
        this.offsetY = 100;
        this.player = new Player(this, width/2, height/2, 'tailer');
        this.player.speed = 300; // 플레이어 속도 설정

        


        // 1. 바닥에 떨어진 아이템들을 모아둘 물리 그룹 생성
        this.groundItems = this.physics.add.group();
        // 3. 몹(몬스터) 그룹 생성
        this.mobs = this.physics.add.group();

        // 2. 플레이어와 바닥 아이템 그룹이 겹치면(Overlap) 줍기 함수 호출 설정
        // collide가 아닌 overlap을 써야 물리적으로 튕기지 않고 부드럽게 통과하며 이벤트를 처리합니다.
        this.physics.add.overlap(
            this.player, 
            this.groundItems, 
            this.handlePickupItem, 
            null, 
            this
        );

        
        // 예시: 나무 그루 랜덤 생성하기
        for (let i = 0; i < 12; i++) {
            this.spawnRandomTree();
        }

        // 1. 기본 카메라 세팅 (플레이어를 중앙에 두고 따라다님)
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        // 기본 오프셋은 0, 0 (플레이어가 화면 정중앙)
        this.cameras.main.setFollowOffset(0, this.offsetY);

        /* 
        TEST 
        */
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
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        }, true, true);

        /*
        this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
            x: 160, y: height-160, radius: 120,
            base: this.add.circle(0, 0, 90, 0x888888, 0.5),
            thumb: this.add.circle(0, 0, 50, 0xcccccc, 0.8),
            dir: '8dir', forceMin: 16, enable: true
        });
        */
        //키보드 입력
        // 스페이스바 키 등록
        this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE,true,true);

        this.input.keyboard.on('keydown-I', () => {
            // 1. 게임 화면은 일시정지 (물리엔진, 타이머 등이 멈춤)
            //this.scene.pause(); 
            if(this.scene.isActive('InventoryScene'))return;
            // 2. 인벤토리 씬을 위에 겹쳐서 실행 (launch는 병렬 실행을 뜻함)
            // 캐릭터의 아이템 데이터(inventoryData)를 인벤토리 씬으로 넘겨줄 수 있습니다.
            this.scene.launch('InventoryScene', { items: this.player.inventory });
        });


    }
    handleJoystickInput(_joyStick){
        this.joyStick = _joyStick;
    }
    /**
     * 인벤토리 개폐 여부에 따라 카메라 초점을 부드럽게 이동시킵니다.
     * @param {boolean} isInventoryOpen - 인벤토리가 열렸는지 여부
     */
    setCameraFocusForInventory(isInventoryOpen) {
        const targetOffsetX = isInventoryOpen ? -450 : 0;

        if (this.cameraTween) this.cameraTween.stop();

        // 🌟 [안전한 수정] 언더바(_) 변수 대신 공식 프로퍼티나 메서드를 사용합니다.
        // 현재 카메라의 X 오프셋 값을 안전하게 가져옵니다 (없으면 0으로 초기화)
        const currentX = this.cameras.main.followOffsetX !== undefined 
            ? this.cameras.main.followOffsetX 
            : (this.cameras.main._followOffset ? this.cameras.main._followOffset.x : 0);

        // 일반 자바스크립트 객체에 시작값 주입
        const tweenData = { currentX: currentX };

        this.cameraTween = this.tweens.add({
            targets: tweenData,
            currentX: targetOffsetX, // 목표 수치 (150 또는 0)
            duration: 300,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
                // 🎯 실시간으로 변하는 수치를 카메라 오프셋에 안전하게 주입
                this.cameras.main.setFollowOffset(tweenData.currentX, this.offsetY);
            },
            onComplete: () => {
                // 완료 후 최종 목적지 값 고정
                this.cameras.main.setFollowOffset(targetOffsetX, this.offsetY);
            }
        });
    }

    update() {
        this.handleYSorting();

        // 스페이스바를 누르면 사거리 50픽셀로 공격 실행
        if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
            this.player.attack(); 
        }
        
        
        // (기존에 작성했던 아이소메트릭 이동 알고리즘 및 flipX 로직이 들어가는 곳)
        let dx = 0;
        let dy = 0;

        // --- 1. 키보드 입력 감지 ---
        if (this.cursors.left.isDown || this.wasd.left.isDown) dx = -1;
        else if (this.cursors.right.isDown || this.wasd.right.isDown) dx = 1;

        if (this.cursors.up.isDown || this.wasd.up.isDown) dy = -1;
        else if (this.cursors.down.isDown || this.wasd.down.isDown) dy = 1;

        // --- 2. 조이스틱 입력 감지 (키보드 입력이 없을 때 적용) ---
        if (dx === 0 && dy === 0 && this.joyStick!=null && this.joyStick.pointer) {
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
        this.player.updateRotationByVelocity();
    }

    

    getItem(id, num = -1, data=null){
        // 레지스트리에서 로드된 정적 마스터 DB 꺼내오기
        const itemDB = this.registry.get('ITEM_DATABASE');
        const baseItem = itemDB[id];
        if (!baseItem) return;

        // 2.  원본을 먼저 안전하게 깊은 복사합니다.
        const item = structuredClone(baseItem); 
        const _num = num<0 ? Phaser.Math.Between(1, 100) : num; // 랜덤 개수 설정
        const _maxCount = Math.abs(item.count)||null;
        const count = data!=null? data.count : null;
        const fresh = data!=null? data.fresh : null;
        const fluidType = data!=null? data.fluidType : item.subType;
        const amount = data!=null? data.amount : null;
        //console.log(`count:${count}, fresh:${fresh}` );


        // 3. 복사본(item)을 대상으로 데이터를 초기화 및 추가합니다.
        if (item.type === 'foods') {
            //item.count = 1;
            item.maxFresh = 100;
            item.fresh =fresh || _num // 이제 완벽히 개별적인 랜덤 값이 유지됩니다.
            item.useItem = ()=>{
                console.log(`::eat ${item.id} (fresh:${item.fresh}/${item.maxFresh})`);
                item.id='';
                const inv = this.registry.get('playerInventory') || [];
                for(let i =0 ; i<inv.length; i++){
                    if(inv[i].id=='') { inv.splice(i,1);i--} 
                }
                this.registry.set('playerInventory', inv);
            };
        }
        if (item.type === 'fluidContainer') {
            const convertIcon = itemDB['bottle'].icon;
            item.fluidType = fluidType || 'empty';
            item.subType =null;
            item.useItem = ()=>{
                
                if(item.amount >0){
                    console.log(`::drink ${item.id}, ${item.amount}cc`);
                    item.amount = 0;
                    item.fluidType = 'empty';
                    item.icon = convertIcon;
                    item.id = 'bottle';
                    const inv = this.registry.get('playerInventory') || [];
                    this.registry.set('playerInventory', inv);
                }
            };
            if(item.fluidType=='empty'){
                item.icon = convertIcon;
                item.id = 'bottle';
                item.amount =0;
                
            }else{
                item.amount =  amount || _num;
            }
            
            item.maxAmount = 100;
        }
         
        if (Number(item.count)  !=0) {
            if(Number(item.count) < 0){
                item.count = count || _num;
            }else{
                item.count = count || 1; // 기본 개수 초기화
            }
            //console.log(_maxCount);
            item.maxCount = _maxCount ; // 최대 개수 설정
        }else{
            item.count = null;
        }
        //console.log(`${item.id}:  ${item.count}`);
        // 4. 안전해진 복사본 반환
        return item;
    }
    calculateInventoryWeight(){
         // 1. 무게 데이터 가져오기 (현재 무게 계산 및 최대 무게 설정)
        const playerInventory = this.registry.get('playerInventory') || [];
        
        // 가방 안의 모든 아이템 무게 합산 (아이템 데이터에 weight 속성이 있다고 가정, 없으면 기본값 1)
        let currentWeight = playerInventory.reduce((sum, item) => {
            if (!item) return sum;
            
            const fluidWeight = item.amount!=null? item.amount : 0;

            const itemWeight = fluidWeight + item.weight !== undefined ? item.weight : 1; 
            return sum + (itemWeight * (item.count || 1));
        }, 0);

        const maxWeight = this.registry.get('maxWeight') || 10000; // 가방 최대 무게 제한
        // 비율 계산 (0.0 ~ 1.0 사이로 안전하게 고정)
        const weightRatio = Phaser.Math.Clamp(currentWeight / maxWeight, 0, 1);
        
        this.registry.set('InventoryWeight', currentWeight);
        this.registry.set('InventoryWeightRatio', weightRatio);
        this.registry.set('maxWeight',maxWeight);
    }
    /**
     * 플레이어가 바닥의 아이템과 접촉했을 때 호출되는 함수
     * @param {Phaser.GameObjects.GameObject} player - 플레이어 객체
     * @param {Phaser.GameObjects.Container} droppedItemContainer - 바닥에 떨어진 아이템 컨테이너
     */
    handlePickupItem(player, droppedItemContainer) {
        // 1. 컨테이너에 심어두었던 아이템 데이터 획득

        const itemData = droppedItemContainer.getData('itemData');
        //console.log(itemData);
        if (!itemData) return;

        // 2. 현재 인벤토리 배열 가져오기
        let inv = this.registry.get('playerInventory') || [];

        // ─── 🌟 인벤토리 공간 및 중첩(Stack) 여부 검사 ───
        this.calculateInventoryWeight();
        if (this.registry.get('InventoryWeightRatio') >=1 ) {
            // 가방이 가득 찼다면 줍지 못하고 안내 문구 출력 후 종료
            console.log("❌ 인벤토리가 가득 차서 아이템을 주울 수 없습니다!");
            return; 
        }
        // [가정] 만약 동일한 아이템이 가방에 이미 있고, 겹칠 수 있는 아이템(예: 음식/재료)이라면?
        // (만약 장비류 아이템이라 겹칠 수 없다면 이 조건문 분기는 생략하거나 대분류를 체크하세요)
        const existingItem = inv.find(item => item && item.id === itemData.id && (item.count==null || item.count && item.count< item.maxCount));

        //console.log(existingItem.count);
        if (existingItem && existingItem.count!=null ) {
            // 이미 가방에 있는 아이템이므로 개수만 더해줍니다.
            existingItem.count = (existingItem.count || 1) + (itemData.count || 1);
            if(existingItem.count> existingItem.maxCount){
                itemData.count = existingItem.count- existingItem.maxCount;
                inv.push(itemData);
                existingItem.count = existingItem.maxCount;
            }
        } else {
            // 완전히 새로운 아이템인 경우 가방 빈칸 확인 (최대 20칸)
            
            
            // 빈칸이 없어야 하므로 배열 맨 뒤에 차곡차곡 push
            // 주울 때 개수 정보가 유실되지 않도록 기본값 보정
            //if (!itemData.count) itemData.count = 1; 
            inv.push(itemData);
        }

        // 3. 갱신된 인벤토리 데이터를 레지스트리에 저장 (화면이 열려있다면 실시간 자동 리렌더링됨)
        this.registry.set('playerInventory', inv);

        // 4. 줍기 연출 (뿅 하고 사라지는 트윈 애니메이션 후 삭제)
        // 연동 중에 중복 충돌이 일어나 데이터가 뻥튀기되는 것을 막기 위해 물리 바디부터 즉시 비활성화합니다.
        droppedItemContainer.body.enable = false; 

        //console.log(`🎒 아이템 획득: ${itemData.id}`);

        this.tweens.add({
            targets: droppedItemContainer,
            scale: 0,
            y: droppedItemContainer.y - 30, // 살짝 위로 올라가며 사라지는 연출
            duration: 150,
            ease: 'Power1',
            onComplete: () => {
                // 애니메이션이 끝나면 메모리에서 객체 완전 파괴
                droppedItemContainer.destroy();
            }
        });
    }
    handleYSorting(){
        // 1. 정렬할 대상을 배열로 싹 모읍니다.
        // 플레이어 + 바닥 아이템 전체 + 몹 전체
        const targets = [
            this.player,
            ...this.groundItems.getChildren(),
            ...this.mobs.getChildren()
        ];

        // 2. 각 객체의 Y 좌표를 그대로 depth로 주입합니다.
        // Phaser 3는 depth 숫자가 클수록 앞(위)에 그려집니다. 
        targets.forEach(obj => {
            if (!obj || !obj.active) return;

            // 💡 오브젝트의 종류에 따라 최하단(발밑) Y 좌표를 다르게 계산합니다.
            let bottomY = obj.y;

            if (obj.body) {
                // 물리 바디가 있다면, 물리 바디의 맨 아래쪽 Y 좌표(발밑)를 기준으로 삼습니다.
                bottomY = obj.body.bottom; 
            } else if (obj.displayHeight) {
                // 일반 이미지라면 중심점(Origin) 기준 맨 아래쪽 계산
                bottomY = obj.y + (obj.displayHeight * (1 - obj.originY));
            }

            // 발밑 좌표를 depth로 지정하면 완벽한 Y-Sorting 완성!
            obj.depth = bottomY;
        });
    }

    /**
     * 맵의 랜덤한 위치에 상호작용 가능한 나무를 스폰합니다.
     */
    spawnRandomTree() {
        // 1. 맵 크기 안에서 랜덤 좌표 추출
        const randomX = Phaser.Math.Between(-500, 2500);
        const randomY = Phaser.Math.Between(-200, 1200);

        // 🌟 2. 빈 컨테이너 생성 후 물리 엔진 적용
        const tree = this.add.container(randomX, randomY);
        this.physics.add.existing(tree); // 아케이드 물리 바디 부여

        // 🌟 3. 컨테이너 내부에 이모지 텍스트 추가
        // 컨테이너 중심(0, 0)을 기준으로 이모지가 이쁘게 안착하도록 setOrigin(0.5)을 줍니다.
        // 1. 사용할 나무 이모지들을 배열로 선언
        const treeEmojis = ['🌲', '🌳', '🌴', '🎄'];
        const randomEmoji = Phaser.Utils.Array.GetRandom(treeEmojis);
        const size = Phaser.Math.Between(226, 360);

        const treeText = this.add.text(0, 0, randomEmoji , { font: `${size}px Arial` }).setOrigin(0.5, 0.8);
        tree.add(treeText);
        
        // 4. 요구사항 데이터 심기
        tree.inventory = [this.getItem('wood',1), this.getItem('wood',1)];
        tree.stat = { 
            hp: 10 ,
            icon:randomEmoji
        };
        if(randomEmoji=='🌳' && Math.random()<0.6){
            tree.inventory.push( this.getItem('apple',100));
        }
        //console.log(tree.inventory);

        // 5. 물리 설정 (밀리지 않게 고정)
        if (tree.body) {
            tree.body.setImmovable(true); // 컨테이너가 아닌 body에 직접 setImmovable을 실행합니다.
            tree.body.moves = false;      // 물리 이동 연산 끄기 (기존 동일)
        }

        // 🌟 6. [매우 중요] 컨테이너 물리 히트박스(Body) 및 오프셋 재설정
        // 컨테이너는 초기 크기가 0이라서 body.setSize를 명시적으로 꼭 지정해 주어야 충돌이 먹힙니다.
        // 나무 밑동(기둥) 부분만 길막이 되도록 좁게 잡아줍니다.
        const hitboxWidth = 48;  // 기둥 두께
        const hitboxHeight = 36; // 기둥 높이
        
        tree.body.setSize(hitboxWidth, hitboxHeight);
        
        // 💡 컨테이너 중심(0,0)을 기준으로 히트박스를 '발밑(밑동)'으로 내리는 오프셋 공식
        // 이모지 텍스트의 크기 절반만큼 아래로 내려서 기둥 위치에 정확히 맞춥니다.
        tree.body.setOffset(-hitboxWidth / 2, 8); 

        // 7. 플레이어와 나무가 부딪히도록 충돌 설정
        this.physics.add.collider(this.player, tree);

        // 8. 관리 그룹에 추가하여 Y-Sorting 시스템에 편입
        this.mobs.add(tree); 
    }

    


}