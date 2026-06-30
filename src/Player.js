// Phaser가 전역(window.Phaser)에 등록되어 있다면 바로 사용 가능합니다.
export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        // Super를 호출하여 Phaser Sprite의 기본 생성자를 실행해야 합니다.
        super(scene, x, y, texture);


        this.inventory = []; // 플레이어의 인벤토리 초기화

        this.scene.registry.set('playerInventory', this.inventory);

        this.lastDirection ='left';
        // 씬에 객체 추가 및 물리 엔진 등록
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 플레이어의 크기와 위치를 조정할 수 있습니다.
        this.setScale(0.25); // 크기 조정 (필요에 따라 변경)
        this.setOrigin(0.5, 1); // 중심점을 스프라이트의 중앙으로 설정

        // 🌟 [핵심] 캐릭터 발밑 히트박스 정밀 튜닝
        // 캐릭터의 실제 텍스처(이미지) 크기에 맞게 수치를 조절하세요.
        const hitboxWidth = 64;  // 발밑 가로 폭 (작게 잡을수록 정밀해짐)
        const hitboxHeight = 64; // 발밑 세로 높이
        
        this.body.setSize(hitboxWidth, hitboxHeight);

        // 🌟 [핵심] 오프셋(Offset) 조정으로 히트박스를 발끝으로 내리기
        // this.width와 this.height는 캐릭터 이미지의 원본 크기입니다.
        const offsetX = (this.width - hitboxWidth) / 2; // 가방 가로 중앙 정렬
        const offsetY = this.height - hitboxHeight - 32;  // 이미지 맨 아래에서 5픽셀 위로 배치
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
    dropItem(itemData, target) {
        // 🌟 [수정] 플레이어가 아닌, 넘겨받은 target의 중심 좌표를 시작점으로 설정합니다.
        // 만약 target이 올바르지 않다면 안전장치로 플레이어(this) 자신을 사용합니다.
        const source = target || this;
        
        // 대상의 물리 바디 중심점을 우선으로 잡고, 없으면 일반 x, y를 씁니다.
        const startX = source.body ? source.body.center.x : source.x;
        const startY = source.body ? source.body.center.y : source.y;

        // 2. 물리 컨테이너 생성 (아이콘과 텍스트를 한 몸으로 묶음)
        const dropContainer = this.scene.add.container(startX, startY);
        this.scene.physics.add.existing(dropContainer); // 컨테이너에 물리(Physics) 주입

        // 3. 내부 요소 배치 (이모지 아이콘 & 아이템 이름/개수 텍스트)
        const iconText = this.scene.add.text(0, 0, itemData.icon, { font: '48px Arial' }).setOrigin(0.5);
        
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
        dropContainer.body.setSize(64,64);
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

    /**
     * 💡 플레이어의 현재 속도를 벡터 분석하여 lastDirection을 결정합니다.
     */
    updateDirectionByVelocity() {
        if (!this.body) return;

        const vx = this.body.velocity.x;
        const vy = this.body.velocity.y;

        // 움직임이 없을 때는 이전 방향(lastDirection)을 그대로 유지합니다.
        if (vx === 0 && vy === 0) return;

        // X축 이동량과 Y축 이동량의 절대값을 비교하여 더 우세한 방향을 선택합니다.
        if (Math.abs(vx) > Math.abs(vy)) {
            // 좌우 이동이 더 강할 때
            this.lastDirection = vx > 0 ? 'right' : 'left';
        } else {
            // 상하 이동이 더 강할 때
            this.lastDirection = vy > 0 ? 'down' : 'up';
        }
    }
    /**
     * 매 프레임 플레이어의 움직임을 관측하여 360도 바라보는 각도를 갱신합니다.
     */
    updateRotationByVelocity() {
        if (!this.body) return;

        const vx = this.body.velocity.x;
        const vy = this.body.velocity.y;

        // 플레이어가 완전히 멈춰있을 때는 마지막으로 바라보던 각도를 그대로 유지합니다.
        if (vx === 0 && vy === 0) return;

        // 🌟 [핵심] 아크탄젠트(atan2) 함수를 사용하여 X, Y 속도 벡터로 360도 라디안 각도를 추출합니다.
        // 결과값은 -Math.PI ~ Math.PI 범위로 나옵니다.
        this.lastAttackAngle = Math.atan2(vy, vx);
    }
    /**
     * 360도 조준 각도 방향으로 사거리(distance)만큼 긴 공격 히트박스를 형성합니다.
     * @param {number} distance - 공격 사거리 (기본 60픽셀)
     */
    attack(distance = 300) {
        if (this.isAttacking) return;
        
        // 공격 직전 마지막 각도를 최신화 (멈춰 서서 때릴 때를 대비)
        
        
        // 혹시 게임 시작 직후 한 번도 안 움직였다면 기본값(0도 = 오른쪽) 설정
        if (this.lastAttackAngle === undefined) {
            this.lastAttackAngle = 0; 
        }

        this.isAttacking = true;

        // 1. 공격 센서의 중심점 위치 계산
        // 플레이어 중심점에서 바라보는 방향으로 사거리의 '절반'만큼 전방에 센서 중심을 둡니다.
        const centerX = this.body ? this.body.center.x : this.x;
        const centerY = this.body ? this.body.center.y : this.y;

        // 삼각함수로 전방 배치 좌표 환산
        const hitboxX = centerX + Math.cos(this.lastAttackAngle) * (distance / 2);
        const hitboxY = centerY + Math.sin(this.lastAttackAngle) * (distance / 2);

        // 2. 사거리만큼 긴 직사각형 조작 영역(Zone) 생성
        const hitboxWidth = distance; // 앞으로 뻗어나가는 길이
        const hitboxHeight = 80;      // 종방향 공격 판정 두께 (칼 궤적 폭)

        const attackZone = this.scene.add.zone(hitboxX, hitboxY, hitboxWidth, hitboxHeight);
        this.scene.physics.add.existing(attackZone);
        attackZone.body.setAllowGravity(false);
        attackZone.body.moves = false;

        // 🌟 [핵심] 조이스틱 조준 각도대로 센서 박스 자체를 360도 회전시킵니다!
        attackZone.setRotation(this.lastAttackAngle);

        // 🎨 [디버깅용 시각화] 내 공격이 어디로 나가는지 눈으로 확인하고 싶다면 켜세요!
        
        const debugBox = this.scene.add.rectangle(hitboxX, hitboxY, hitboxWidth, hitboxHeight, 0xff0000, 0.4);
        debugBox.setRotation(this.lastAttackAngle);
        this.scene.time.delayedCall(120, () => debugBox.destroy());
        

        // 3. 타격 그룹과의 겹침 감지
        this.scene.physics.add.overlap(attackZone, this.scene.mobs, (zone, target) => {
            this.handleHitTarget(target); // 타격 처리 로직 (기존과 동일)
        }, null, this);

        // 4. 짧은 프레임 유지 후 센서 삭제
        this.scene.time.delayedCall(120, () => {
            attackZone.destroy();
            this.isAttacking = false;
        });
    }

    /**
     * 실제로 무언가 맞았을 때 처리하는 데미지 함수
     */
    handleHitTarget(target) {
        // 이미 피격 쿨타임 중이거나 죽은 대상이면 무시
        if (target.isHitCooltime || (target.stat && target.stat.hp <= 0)) return;

        // 타격 대상에게 0.5초간 무적(피격 쿨타임) 부여하여 다단히트 버그 방지
        target.isHitCooltime = true;
        this.scene.time.delayedCall(500, () => { target.isHitCooltime = false; });

        // 스탯 검사 후 데미지 입히기
        if (target.stat && target.stat.hp !== undefined) {
            target.stat.hp -= 2; // 플레이어 공격력 기본값 2 가정
            console.log(`💥 [타격!] 대상 HP: ${target.stat.hp}`);

            // 빨간색으로 깜빡이는 피격 이펙트 연출
            this.scene.tweens.add({
                targets: target,
                alpha: 0.5,
                tint: 0xff0000,
                duration: 80,
                yoyo: true,
                repeat: 1,
                onComplete: () => { if (target) { target.alpha = 1; } }
            });

            // HP가 0 이하가 되면 파괴 및 아이템 드롭 처리
            if (target.stat.hp <= 0) {
                this.handleTargetDestroy(target);
            }
        }
    }

    /**
     * 대상이 파괴되었을 때 아이템을 드롭하고 월드에서 지우는 함수
     */
    handleTargetDestroy(target) {
        console.log(`💀 대상이 파괴되었습니다!`);

        // 만약 나무 등이 매장하고 있던 인벤토리 아이템이 있다면 바닥에 드롭
        if (target.inventory && target.inventory.length > 0) {
            target.inventory.forEach(item => {
                this.dropItem(item, target ); // 이전에 만든 360도 랜덤 드롭 함수 활용
            });
        } else {
            
        }

        // 몹 제거 연출 후 완전히 삭제
        this.scene.tweens.add({
            targets: target,
            scale: 0,
            angle: 90,
            duration: 200,
            onComplete: () => {
                target.destroy();
            }
        });
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