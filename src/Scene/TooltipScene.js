export default class TooltipScene extends Phaser.Scene {
    constructor() {
        super('TooltipScene');
    }

    create() {
        // 1. 툴팁을 하나로 묶어줄 컨테이너 생성 (처음엔 숨김)
        this.container = this.add.container(0, 0).setVisible(false);
        const _width = 320; // 툴팁 기본 너비

        // 2. 패널 배경 (디자인에 맞게 크기 조절)
        // 🌟 [수정] 기존 Rectangle 대신 Graphics 객체를 사용하여 배경과 테두리를 동적으로 그립니다.
        this.bg = this.add.graphics();

        // 3. 내부 텍스트 구성 (이름, 태그, 설명 등)
        this.titleText = this.add.text(12, 12, '', { font: 'bold 32px Arial', fill: '#ffcc00' });
        this.tagText = this.add.text(12, 50, '', { font: '24px Arial', fill: '#888888' });

        let ypos = 90;
        
        this.weightText = this.descText = this.add.text(12, ypos, '', { 
            font: '22px Arial', 
            fill: '#ffffff', 
            wordWrap: { width: _width-24 } 
        });
        ypos+=40;

        this.descText = this.add.text(12, ypos, '', { 
            font: '24px Arial', 
            fill: '#ffffff', 
            wordWrap: { width: _width-24 } 
        });

        this.container.add([this.bg, this.titleText, this.tagText, this.weightText, this.descText]);
    }

    /**
     * 외부 씬에서 툴팁을 켜고 데이터를 주입할 때 호출하는 함수
     */
    show(pointer, itemData) {
        this.container.setVisible(true);
        
        // 데이터 연결
        this.titleText.setText(`${itemData.icon}${itemData.id || '알 수 없는 아이템'} ${itemData.count > 1 ? `x${itemData.count}` : ''  }`);
        
        this.tagText.setText(`${itemData.type} / ${itemData.subType}` || '');

        const weight = itemData.count!=null ? (itemData.weight/1000*itemData.count) : (itemData.weight/1000) || 0;
        const str =weight.toString();
        this.weightText.setText( `⚖️${ str.includes('.') ? str : str + '.0' }` );

        this.descText.setText(itemData.count || '상세 설명이 없습니다.');

        // 텍스트 길이에 맞춰 배경 세로 크기 동적 조절 (센스 꿀팁!)
        const textBottom = this.descText.y + this.descText.displayHeight;
        const dynamicHeight = Math.max(100, textBottom + 12);
        const dynamicWidth = 280; // 가로는 고정
        this.bg.clear();
        // 1. 내부 채우기 색상 설정 (배경)
        this.bg.fillStyle(0x111111, 0.95);
        this.bg.fillRect(0, 0, dynamicWidth, dynamicHeight);

        // 2. 외곽 테두리 선 설정 (테두리도 이제 크기에 맞춰서 새로 그려집니다!)
        this.bg.lineStyle(1, 0xffffff, 0.3);
        this.bg.strokeRect(0, 0, dynamicWidth, dynamicHeight);

        // 위치 갱신
        this.updatePosition(pointer);
        
        // 🌟 툴팁 씬이 인벤토리보다 항상 위에 보이도록 레이어 맨 위로 당김
        this.scene.bringToTop();
    }

    /**
     * 마우스 좌표에 맞춰 툴팁 위치를 이동시키는 함수
     */
    updatePosition(pointer) {
        // 마우스 커서 우측 하단에 살짝 여백(15px)을 두고 배치
        this.container.setPosition(pointer.x + 15, pointer.y + 15);
    }

    /**
     * 툴팁을 숨길 때 호출하는 함수
     */
    hide() {
        if (this.container) {
            this.container.setVisible(false);
        }
    }
}