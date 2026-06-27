export default class InventoryScene extends Phaser.Scene {
    constructor() {
        super('InventoryScene');
    }

    create() {
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. 첫 화면 렌더링
        this.add.rectangle(width/2, height/2, width, height,0x0000, 0.8); // 팝업창 배경
        this.add.text(width/2, 100, 'Inventory', { font: '64px Arial', fill: '#ffffff' }).setOrigin(0.5);

        //this.add.rectangle(width/2, height/2, 420, 500, 0x000000, 0.85).setStrokeStyle(2, 0xffffff, 0.5);

        // 2. 🌟 중요: 아이템들을 담아둘 'UI 그룹' 생성
        this.itemGroup = this.add.group();

        this.renderInventory();

        // 2. 레지스트리가 업데이트되면 자동으로 UI 새로고침
        this.registry.events.on('changedata-playerInventory', this.renderInventory, this);
        
        // 인벤토리 배경 및 아이템 슬롯 그리기 로직...
        

        // 다시 'I'를 누르면 인벤토리 닫기
        this.input.keyboard.on('keydown-I', () => {
            this.closeInventory();
        });
    }

    closeInventory() {
        // 1. 깨울 씬을 먼저 Resume (다시 돌리기)
        this.scene.resume('GameScene');
        // 2. 자기 자신(인벤토리)은 정지 및 숨김
        this.scene.stop();
    }

   renderInventory() {
        // [A] 🌟 핵심: 새로운 그림을 그리기 전에, 기존에 그룹에 있던 아이템들만 싹 지웁니다.
        // clear(true, true) -> 첫 번째 true: 그룹에서 제거, 두 번째 true: 실제 게임 화면에서 파괴(Destroy)
        if (this.itemGroup) {
            this.itemGroup.clear(true, true);
        }

        const playerInventory = this.registry.get('playerInventory') || [];
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const startX = centerX - 320;
        const startY = centerY - 150;
        const slotSize = 96;
        const padding = 16;
        const cols = 8;
        const iconSize = 64;

        // --- 1. 휴지통(버리는 칸) 만들기 ---
        const trashX = centerX
        const trashY = height-100;
        const trashBg = this.add.rectangle(trashX, trashY, 300, 80, 0xDD7777)
                            .setOrigin(0.5)
                            .setStrokeStyle(1, 0xffffff, 0.5);
        this.add.text(trashX , trashY , '🗑️remove', { font: '32px Arial' }).setOrigin(0.5);
        
        // 휴지통 전용 데이터 심기 및 드롭존 설정
        trashBg.setData('slotType', 'trash');
        trashBg.setInteractive({ dropZone: true });
        this.itemGroup.add(trashBg);

        // 1. 장비 슬롯 설정 정의 (부위별 키값, 위치, 가이드 문구)
        const equipSlots = [
            { key: 'weapon',  x: centerX - 240, y: centerY - 320, label: 'Weapon' },
            { key: 'armor',   x: centerX - 120,  y: centerY - 320, label: 'Armor' },
            { key: 'helmet',  x: centerX,       y: centerY - 320, label: 'Helmet' },
            // 추가하고 싶은 부위가 있다면 여기에 한 줄만 더 쓰면 끝납니다!
        ];
        const validKeys = equipSlots.map(slot => slot.key);

        // 2. 반복문으로 모든 장비 슬롯 자동 생성
        equipSlots.forEach(slot => {
            // 레지스트리 키 규칙을 'equipped_' + key 로 통일하면 편리합니다.
            const equippedItem = this.registry.get(`equipped_${slot.key}`) || null;
            let equipBgColor = equippedItem ? 0x224488 : 0x333333;

            // 슬롯 배경 그리기
            const equipBg = this.add.rectangle(slot.x, slot.y, slotSize, slotSize, equipBgColor)
                                .setOrigin(0, 0)
                                .setStrokeStyle(2, 0xffd700, 0.5);
            
            equipBg.setData('slotType', 'equipment');
            equipBg.setData('slotIndex', slot.key); // 'weapon', 'armor' 등이 들어감
            equipBg.setInteractive({ dropZone: true });
            this.itemGroup.add(equipBg);

            if (equippedItem) {
                // 장착된 아이템 아이콘 생성
                const equipIcon = this.add.text(slot.x + slotSize / 2, slot.y + slotSize / 2, equippedItem.icon, 
                    { font: `${iconSize}px Arial` }).setOrigin(0.5);
                this.itemGroup.add(equipIcon);

                // 드래그 설정 및 데이터 심기
                equipIcon.setInteractive({ useHandCursor: true });
                this.input.setDraggable(equipIcon);
                equipIcon.setData('fromIndex', slot.key); // 출발지 저장 ('weapon', 'armor' 등)
                equipIcon.setData('originX', slot.x + slotSize / 2);
                equipIcon.setData('originY', slot.y + slotSize / 2);

                // 드래그 이벤트 (모든 부위 공용)
                equipIcon.on('drag', (pointer, dragX, dragY) => {
                    equipIcon.setDepth(100);
                    equipIcon.x = dragX;
                    equipIcon.y = dragY;
                    equipIcon.setFontSize(iconSize + 32);
                });
                equipIcon.on('dragend', () => {
                    equipIcon.x = equipIcon.getData('originX');
                    equipIcon.y = equipIcon.getData('originY');
                    equipIcon.setDepth(1);
                    equipIcon.setFontSize(iconSize);
                });
                
                // 툴팁 연동 (저번에 구현한 툴팁도 공용 적용)
                equipIcon.on('pointerover', (pointer) => this.scene.get('TooltipScene')?.show(pointer, equippedItem));
                equipIcon.on('pointermove', (pointer) => this.scene.get('TooltipScene')?.updatePosition(pointer));
                equipIcon.on('pointerout', () => this.scene.get('TooltipScene')?.hide());

                // 🌟 가방 이모지 더블 터치 이벤트 추가
                let lastClickTime = 0;
                equipIcon.on('pointerdown', (pointer) => {
                    const clickDelay = pointer.time - lastClickTime;
                    lastClickTime = pointer.time;

                    // 350ms(0.35초) 이내에 다시 누르면 더블 터치로 판정
                    if (clickDelay < 350) {
                       //console.log('가방 아이템 더블 터치 감지:', equippedItem.id);
                         const currentEquip = this.registry.get(`equipped_${slot.key}`);
                        if (currentEquip) {
                            let inv = this.registry.get('playerInventory') || [];
                            inv.push(equippedItem);
                            this.registry.set(`equipped_${slot.key}`, null);
                            this.registry.set('playerInventory', inv);
                            
                        }

                    }
                });

            } else {
                // 빈 슬롯일 때 부위별 가이드 텍스트 표시
                const guideText = this.add.text(slot.x + slotSize / 2, slot.y + slotSize / 2, slot.label, { font: '24px Arial', fill: '#888888' }).setOrigin(0.5);
                this.itemGroup.add(guideText);
            }
        });
        // 슬롯과 아이템들을 담을 임시 배열 (드롭 대상 감지용)
        const slotZones = [];

        for (let i = 0; i < playerInventory.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const slotX = startX + col * (slotSize + padding);
            const slotY = startY + row * (slotSize + padding);

            const itemData = playerInventory[i];
            
            // 배경 색상 결정: 음식이면 초록색, 아니면 회색
            let slotBgColor = itemData ? (itemData.type === 'foods' ? 0x2e5c1e : 0x444444) : 0x222222;

            const bg = this.add.rectangle(slotX, slotY, slotSize, slotSize, 0xffffff)
                           .setOrigin(0, 0)
                           .setStrokeStyle(1, 0xffffff, 0.2);

            let freshratio = 0;
            if (itemData.maxFresh!=null){
                const freshnessRatio = itemData.fresh / itemData.maxFresh;
                const freshnessColor = Phaser.Display.Color.Interpolate.ColorWithColor(
                    new Phaser.Display.Color(255, 0, 0), // 빨강
                    new Phaser.Display.Color(0, 255, 0), // 초록
                    100,
                    freshnessRatio * 100
                );
                slotBgColor  = Phaser.Display.Color.GetColor(freshnessColor.r, freshnessColor.g, freshnessColor.b);
                freshratio = freshnessRatio;
               
            }
            const bgfresh = this.add.rectangle(slotX, slotY+slotSize, slotSize, slotSize*freshratio, slotBgColor )
                           .setOrigin(0, 1)
                           .setStrokeStyle(1, 0xffffff, 0.2); this.itemGroup.add( bgfresh );
            
            // 🌟 중요: 배경에 현재 몇 번째 슬롯인지 데이터를 저장하고 드롭존으로 설정
            bg.setData('slotType', 'inventory'); // 💡 일반 가방 슬롯임을 명시
            bg.setData('slotIndex', i);
            bg.setInteractive({ dropZone: true }); 
            slotZones.push(bg);
            this.itemGroup.add(bg); 

            if (itemData) {
                // 2. 이모지 아이콘 생성
                const icon = this.add.text(slotX + slotSize / 2, slotY + slotSize / 2, itemData.icon, { font: `${iconSize}px Arial` }).setOrigin(0.5);
                this.itemGroup.add(icon);

                // 🌟 아이콘을 드래그 가능하게 설정하고 원래 자리 기억시킴
                icon.setInteractive({ useHandCursor: true });
                this.input.setDraggable(icon);
                icon.setData('fromIndex', i);
                icon.setData('originX', icon.x);
                icon.setData('originY', icon.y);

                // 3. 개수 텍스트 생성
                let countText = null;
                if (itemData.count > 1) {
                    countText = this.add.text(slotX + slotSize - 6, slotY + slotSize - 6, itemData.count.toString(), {
                        font: 'bold 32px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3
                    }).setOrigin(1, 1).setDepth(2);
                    this.itemGroup.add(countText);
                }

                // --- 🌟 드래그 이벤트 리스너 등록 ---
                
               // 드래그 중인 동안
                icon.on('drag', (pointer, dragX, dragY) => {
                    
                    icon.x = dragX;
                    icon.y = dragY;
                    icon.setFontSize(iconSize + 32); // 드래그 중에는 아이콘을 크게
                    icon.setDepth(101); // 드래그 중에는 최상위로
                    if (countText) {
                        //countText.alpha = 0
                        countText.x = dragX + slotSize / 2 - 6;
                        countText.y = dragY + slotSize / 2 - 6;
                        countText.setDepth(102);
                    }; // 숫자 숨기기
                   // const tooltipScene = this.scene.get('TooltipScene');
                   // if (tooltipScene) tooltipScene.hide(); // 드래그 중엔 숨김
                });

                // [수정] 드래그가 완전히 끝났을 때 (성공/실패 불문하고 무조건 실행)
                icon.on('dragend', (pointer) => {
                    // 💡 중요: 실패해서 제자리에 가야 하든, 성공해서 리렌더링을 기다리든
                    // 일단 UI가 튀는 것을 막기 위해 무조건 원래 기억해둔 자리로 안전하게 돌려놓습니다.
                    // 만약 드롭에 성공했다면, 어차피 레지스트리가 갱신되면서 0.001초만에 화면이 새로 그려집니다.
                    icon.x = icon.getData('originX');
                    icon.y = icon.getData('originY');
                    icon.depth = 1;
                    icon.setFontSize(iconSize); // 원래 크기로 복원
                    if (countText) {
                        //countText.alpha = 0
                        countText.x = icon.x + slotSize / 2 - 6;
                        countText.y = icon.y + slotSize / 2 - 6;
                        countText.setDepth(2);
                    };
                    const tooltipScene = this.scene.get('TooltipScene');
                    if (tooltipScene) tooltipScene.hide(); // 드래그 중엔 숨김
                });

                // 1. 마우스가 아이콘 위에 올라갔을 때 (Show)
                icon.on('pointerover', (pointer) => {
                    // 다른 씬을 부를 때는 this.scene.get('씬KEY')로 객체를 직접 획득할 수 있습니다.
                    const tooltipScene = this.scene.get('TooltipScene');
                    if (tooltipScene) {
                        tooltipScene.show(pointer, itemData);
                    }
                });

                // 2. 마우스가 슬롯 안에서 움직일 때 (Move)
                icon.on('pointermove', (pointer) => {
                    const tooltipScene = this.scene.get('TooltipScene');
                    if (tooltipScene) {
                        tooltipScene.updatePosition(pointer);
                    }
                });

                // 3. 마우스가 나갔을 때 (Hide)
                icon.on('pointerout', () => {
                    const tooltipScene = this.scene.get('TooltipScene');
                    if (tooltipScene) {
                        tooltipScene.hide();
                    }
                });

                // 🌟 가방 이모지 더블 터치 이벤트 추가
                let lastClickTime = 0;
                icon.on('pointerdown', (pointer) => {
                    const clickDelay = pointer.time - lastClickTime;
                    lastClickTime = pointer.time;

                    // 350ms(0.35초) 이내에 다시 누르면 더블 터치로 판정
                    if (clickDelay < 350) {
                        //console.log('가방 아이템 더블 터치 감지:', itemData.id);
                        // 아이템의 type을 소문자로 바꿔서 타겟 슬롯 키 생성 (예: 'WEAPON' -> 'weapon')
                        const targetSlotKey = itemData.type.toLowerCase(); 
                        //console.log(validKeys, targetSlotKey);
                        if(validKeys.includes(targetSlotKey)){
                            let inv = this.registry.get('playerInventory') || [];
                            const currentEquip = this.registry.get(`equipped_${targetSlotKey}`) || null;

                            // 드래그했던 것과 똑같은 데이터 연산 수행
                            inv.splice(i, 1); // 현재 인덱스(i)에서 아이템 제거
                            if (currentEquip) inv.splice(i,0,currentEquip); // 기존 템 밀어내기

                            // 데이터 셋팅 -> 자동으로 renderInventory 리렌더링 유도
                            this.scene.get('TooltipScene')?.hide(); // 툴팁 숨기기
                            this.registry.set(`equipped_${targetSlotKey}`, itemData);
                            this.registry.set('playerInventory', inv);
                        }else{
                            return;
                        }
                            
                        
                        
                    }
                });
            }
        }

        // --- 🌟 전역 드롭 이벤트 처리 (create나 여기서 한번만 등록되도록 관리하면 좋으나 편의상 표기) ---
        // --- 4. 🌟 통합 드롭(Drop) 이벤트 처리 🌟 ---
        this.input.off('drop');
        this.input.on('drop', (pointer, gameObject, dropZone) => {
            const fromIndex = gameObject.getData('fromIndex'); // 출발지 (숫자 0~19 또는 'weapon')
            const targetType = dropZone.getData('slotType');   // 도착지 타입 ('inventory', 'equipment', 'trash')
            const toIndex = dropZone.getData('slotIndex');     // 도착지 인덱스 (숫자 0~19 또는 'weapon')

            let inv = this.registry.get('playerInventory') || [];

            // 🗑️ 케이스 A: [버리기] 휴지통에 드롭했을 때
            if (targetType === 'trash') {
                if (typeof fromIndex === 'string') {
                    // 🌟 장착창('weapon', 'armor' 등)에서 바로 휴지통으로 던진 경우
                    console.log(`${fromIndex} 부위 아이템 버림:`, this.registry.get(`equipped_${fromIndex}`));
                    this.registry.set(`equipped_${fromIndex}`, null);
                } else {
                    // 가방(인덱스 숫자)에서 버린 경우 앞으로 당기기
                    console.log('가방에서 아이템 버림:', inv[fromIndex]);
                    inv.splice(fromIndex, 1);
                }
                
                this.registry.set('playerInventory', inv);
                const tooltipScene = this.scene.get('TooltipScene');
                if (tooltipScene) tooltipScene.hide(); // 드래그 중엔 숨김
                return;
            }

            // ⚔️ 케이스 B: [장착하기] 가방에서 장비 슬롯으로 드롭했을 때
            if (targetType === 'equipment' ) {
                const dragItem = inv[fromIndex];
                if (dragItem  ) { // 장비 아이템일 때만 장착 가능

                    if (dragItem.type.toUpperCase() !== toIndex.toUpperCase()) {
                        console.log(`❌ 장착 실패: ${dragItem.type}은(는) ${toIndex} 슬롯에 장착할 수 없습니다!`);
                        return; // 조건을 만족하지 않으면 여기서 함수를 종료시켜 드롭을 취소합니다.
                    }
                    
                    // 기존 장착 무기가 있었다면 가방의 그 자리로 돌려보내고, 새 무기를 장착 (Swap)
                    //inv[fromIndex] = currentEquip; 
                    const currentEquip = this.registry.get(`equipped_${toIndex}`) || null;
                    if(currentEquip!=null){ inv.push(currentEquip); } // 기존 장착 무기가 있었다면 가방에 추가
                    inv.splice(fromIndex, 1); // 드래그한 아이템은 가방에서 제거
                    this.registry.set(`equipped_${toIndex}`, dragItem);
                    this.registry.set('playerInventory', inv);
                    const tooltipScene = this.scene.get('TooltipScene');
                    if (tooltipScene) tooltipScene.hide(); // 드래그 중엔 숨김
                }
                return;
            }
           // 🎒 케이스 C: [장착 해제] 장비 슬롯에서 일반 가방 슬롯으로 드롭했을 때
            if (typeof fromIndex === 'string' && targetType === 'inventory') {
                const currentEquip = this.registry.get(`equipped_${fromIndex}`);
                if (currentEquip) {
                    inv.splice(toIndex, 0, currentEquip); // 드롭한 위치에 장착 해제 아이템 삽입
                    this.registry.set(`equipped_${fromIndex}`, null);
                    this.registry.set('playerInventory', inv);
                    const tooltipScene = this.scene.get('TooltipScene');
                     if (tooltipScene) tooltipScene.hide(); // 드래그 중엔 숨김
                }
                return;
            }

            // 🔄 케이스 D: [일반 위치 변경] 가방 안에서 가방으로 이동할 때 (기존 로직)
            if (typeof fromIndex === 'number' && targetType === 'inventory' && fromIndex !== toIndex) {
                const temp = inv[fromIndex];
                if(temp.maxCount==null){
                    inv[fromIndex] = inv[toIndex];
                    inv[toIndex] = temp;
                }else{
                    // 같은 종류의 아이템이면 합치기
                    if(inv[toIndex] && inv[toIndex].id === temp.id){
                        //꽉 찬 경우 서로 위치 교환
                        if(inv[toIndex].count >= inv[toIndex].maxCount){
                            inv[fromIndex] = inv[toIndex];
                            inv[toIndex] = temp;
                        }else{
                            inv[toIndex].count += temp.count;
                            if(inv[toIndex].count > inv[toIndex].maxCount){
                                //console.log(`합쳐진 아이템이 최대치보다 큽니다.${inv[toIndex].count - inv[toIndex].maxCount} 개 남았습니다. 원래 위치로 되돌립니다.`);
                                // 합쳐진 아이템이 최대치보다 크면 원래 위치로 되돌리기
                                temp.count = inv[toIndex].count - inv[toIndex].maxCount; // 남은 개수 계산
                                inv[fromIndex] = temp; // 원래 위치로 되돌리기
                                inv[toIndex].count = inv[toIndex].maxCount; // 최대치 제한

                            }else{
                                // 합쳐진 아이템이 최대치보다 작으면 원래 위치를 비움
                                inv.splice(fromIndex, 1); // 원래 위치에서 제거
                            }
                        }
                       
                        
                    }else{
                        // 다른 종류의 아이템이면 그냥 위치 교환
                        inv[fromIndex] = inv[toIndex];
                        inv[toIndex] = temp;
                    }
                }
                const tooltipScene = this.scene.get('TooltipScene');
                if (tooltipScene) tooltipScene.hide(); // 드래그 중엔 숨김
                
                this.registry.set('playerInventory', inv);
            }
        });


       
    }
}