// Phaser가 전역(window.Phaser)에 등록되어 있다면 바로 사용 가능합니다.
export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        // Super를 호출하여 Phaser Sprite의 기본 생성자를 실행해야 합니다.
        super(scene, x, y, texture);


        this.inventory = []; // 플레이어의 인벤토리 초기화

        

        this.scene.registry.set('playerInventory', this.inventory);
        // 씬에 객체 추가 및 물리 엔진 등록
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 플레이어의 크기와 위치를 조정할 수 있습니다.
        this.setScale(0.25); // 크기 조정 (필요에 따라 변경)
        this.setOrigin(0.5, 1); // 중심점을 스프라이트의 중앙으로 설정

        // 🌟 [핵심] 캐릭터 발밑 히트박스 정밀 튜닝
        // 캐릭터의 실제 텍스처(이미지) 크기에 맞게 수치를 조절하세요.
        const hitboxWidth = 50;  // 발밑 가로 폭 (작게 잡을수록 정밀해짐)
        const hitboxHeight = 50; // 발밑 세로 높이
        
        this.body.setSize(hitboxWidth, hitboxHeight);

        // 🌟 [핵심] 오프셋(Offset) 조정으로 히트박스를 발끝으로 내리기
        // this.width와 this.height는 캐릭터 이미지의 원본 크기입니다.
        const offsetX = (this.width - hitboxWidth) / 2; // 가방 가로 중앙 정렬
        const offsetY = this.height - hitboxHeight - 5;  // 이미지 맨 아래에서 5픽셀 위로 배치
        
        this.body.setOffset(offsetX, offsetY);

        // 벽이나 맵 경계에 부딪히는 설정 등 기존 코드 유지
        this.body.setCollideWorldBounds(true);
    }
    addItem(item) {
        this.inventory.push(item);
        this.scene.registry.set('playerInventory', this.inventory);
    }

    removeItem(item) {
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            this.inventory.splice(index, 1);
        }
        this.scene.registry.set('playerInventory', this.inventory);
    }

    hasItem(item) {
        return this.inventory.includes(item);
    }
    /**
     * 아이템을 360도 랜덤 방향으로 던져서 바닥에 떨어뜨립니다.
     * @param {object} itemData - 버릴 아이템의 데이터 (icon, name 등)
     */
    dropItem(itemData, length =200) {
        // 1. 현재 플레이어의 중심 좌표 확보
        const startX = this.x;
        const startY = this.y;

        // 2. 물리 컨테이너 생성 (아이콘과 텍스트를 한 몸으로 묶음)
        const dropContainer = this.scene.add.container(startX, startY);
        this.scene.physics.add.existing(dropContainer); // 컨테이너에 물리(Physics) 주입

        // 3. 내부 요소 배치 (이모지 아이콘 & 아이템 이름/개수 텍스트)
        const iconText = this.scene.add.text(0, 0, itemData.icon, { font: '32px Arial' }).setOrigin(0.5);
        
        // 이모지 아래에 작게 표시될 텍스트 (예: "사과 x2")
        const labelStr = itemData.count > 1 ? `${itemData.id} x${itemData.count}` : itemData.id;
        const labelText = this.scene.add.text(0, 22, labelStr, { 
            font: 'bold 16px Arial', 
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        dropContainer.add([iconText, labelText]);

        // 4. 물리 설정 (크기 및 반발력 등 기본 세팅)
        dropContainer.body.setCollideWorldBounds(true); // 화면 밖 나감 방지
        dropContainer.body.setCircle(15, -15, -15);    // 물리 충돌 영역을 중심 기준으로 보정

        // 🌟 5. [핵심] 360도 랜덤 방향 및 100픽셀 이동 계산
        // 라디안 각도 (0 ~ 2*PI 가 360도)
        const randomAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        
        // 던지는 초기 속도 (이 속도와 감속도 조합으로 약 100픽셀 부근에 멈추게 조율합니다)
        const throwSpeed = 450; 
        
        // 각도에 따른 X, Y 속도 분배 분할 계산
        const velocityX = Math.cos(randomAngle) * throwSpeed;
        const velocityY = Math.sin(randomAngle) * throwSpeed;

        // 초기 속도 부여
        dropContainer.body.setVelocity(velocityX, velocityY);

        // 🌟 6. 마찰력(Drag)을 주어 미끄러지듯 멈추게 설정
        // 대략 100픽셀 거리에서 속도가 0이 되어 멈추도록 감속 크기를 맞춥니다.
        dropContainer.body.setDrag( 600 ); 

        // 7. 땅에 떨어진 아이템 상호작용 설정 (가까이 가면 다시 줍기 등)
        // 나중에 플레이어가 이 컨테이너와 겹치면(Overlap) 다시 인벤토리에 넣는 루틴을 짤 수 있도록 데이터를 심어둡니다.
        dropContainer.setData('itemData', itemData);

        // 바닥에 부드럽게 안착하는 연출을 위해 약간의 스케일 애니메이션(트윈)을 주면 더 예쁩니다.
        dropContainer.setScale(0);
        this.scene.tweens.add({
            targets: dropContainer,
            scale: 1,
            duration: 700, // 0.4초 동안 커지면서 날아감
            ease: 'Back.out',
            onComplete: () => {
            // 🌟 [수정] 날아가서 바닥에 안착이 완료된 시점에 물리 감지를 켜줍니다!
                if (dropContainer.body) {
                    dropContainer.body.enable = true;
                    this.scene.groundItems.add(dropContainer);
                }
            }
        });
        
        //console.log(this.scene.groundItems);
        return dropContainer;
    }
    // 이동 로직을 이 안으로 캡슐화할 수 있습니다.
    /*
    update(isoX, isoY, speed) {
        this.setVelocity(isoX * speed, isoY * speed);

    // 이동 로직을 이 안으로 캡슐화할 수 있습니다.
    /*
    update(isoX, isoY, speed) {
        this.setVelocity(isoX * speed, isoY * speed);

        if (isoX < 0) this.setFlipX(false);
        else if (isoX > 0) this.setFlipX(true);
    }*/
}