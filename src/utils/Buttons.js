export class Buttons {
    /**
     * 공용 버튼을 생성하여 반환합니다.
     * @param {Phaser.Scene} scene - 버튼이 그려질 씬 (this)
     * @param {number} x - 버튼의 X 좌표 (중앙 기준)
     * @param {number} y - 버튼의 Y 좌표 (중앙 기준)
     * @param {string} text - 버튼에 들어갈 글자
     * @param {function} callback - 버튼을 클릭했을 때 실행할 함수
     * @returns {Phaser.GameObjects.Container} 생성된 버튼 컨테이너
     */
    static createIconButton(scene, x, y, text, callback) {
        const width = 96;
        const height = 96;

        // 1. 버튼 배경색 설정 (기본, 호버, 클릭 상태의 색상)
        const normalColor = 0x333333;
        const hoverColor = 0x555555;
        const clickColor = 0x222222;

        // 2. 배경 사각형 생성
        const bg = scene.add.rectangle(0, 0, width, height, normalColor)
                       .setStrokeStyle(1, 0xffffff, 0.3);

        // 3. 버튼 텍스트 생성
        const btnText = scene.add.text(0, 0, text, {
            font: 'bold 64px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // 4. 배경과 텍스트를 하나의 Container로 묶음 (좌표 관리가 편해집니다)
        const container = scene.add.container(x, y, [bg, btnText]);
        container.bg = bg; // 배경 사각형을 컨테이너에 속성으로 추가
        container.text = btnText;

        // 5. 컨테이너 크기 지정 및 상호작용(Interactive) 활성화
        container.setSize(width, height);
        container.setInteractive({ useHandCursor: true });

        // ─── 마우스 이벤트 리스너 등록 ───

        // 마우스가 버튼 위에 올라왔을 때 (Hover)
        container.on('pointerover', () => {
            bg.setFillStyle(hoverColor);
            container.setScale(1.05); // 살짝 커지는 효과 추가
        });

        // 마우스가 버튼에서 나갔을 때 (Out)
        container.on('pointerout', () => {
            bg.setFillStyle(normalColor);
            container.setScale(1.0); // 원래 크기로
        });

        // 마우스를 누르는 순간 (Down)
        container.on('pointerdown', () => {
            bg.setFillStyle(clickColor);
            container.setScale(0.95); // 살짝 눌리는 효과
        });

        // 마우스를 뗐을 때 (Up / 클릭 완료)
        container.on('pointerup', () => {
            bg.setFillStyle(hoverColor);
            container.setScale(1.05);
            
            // 지정된 콜백 함수 실행
            if (callback) callback();
        });

        return container;
    }
    static createSimpleButton(scene, x, y, text, callback) {
        const width = 120;
        const height = 64;

        // 1. 버튼 배경색 설정 (기본, 호버, 클릭 상태의 색상)
        const normalColor = 0x333333;
        const hoverColor = 0x555555;
        const clickColor = 0x222222;

        // 2. 배경 사각형 생성
        const bg = scene.add.rectangle(0, 0, width, height, normalColor)
                       .setStrokeStyle(1, 0xffffff, 0.3);

        // 3. 버튼 텍스트 생성
        const btnText = scene.add.text(0, 0, text, {
            font: 'bold 32px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // 4. 배경과 텍스트를 하나의 Container로 묶음 (좌표 관리가 편해집니다)
        const container = scene.add.container(x, y, [bg, btnText]);
        container.bg = bg; // 배경 사각형을 컨테이너에 속성으로 추가
        container.text = btnText;

        // 5. 컨테이너 크기 지정 및 상호작용(Interactive) 활성화
        container.setSize(width, height);
        container.setInteractive({ useHandCursor: true });

        // ─── 마우스 이벤트 리스너 등록 ───

        // 마우스가 버튼 위에 올라왔을 때 (Hover)
        container.on('pointerover', () => {
            bg.setFillStyle(hoverColor);
            container.setScale(1.05); // 살짝 커지는 효과 추가
        });

        // 마우스가 버튼에서 나갔을 때 (Out)
        container.on('pointerout', () => {
            bg.setFillStyle(normalColor);
            container.setScale(1.0); // 원래 크기로
        });

        // 마우스를 누르는 순간 (Down)
        container.on('pointerdown', () => {
            bg.setFillStyle(clickColor);
            container.setScale(0.95); // 살짝 눌리는 효과
        });

        // 마우스를 뗐을 때 (Up / 클릭 완료)
        container.on('pointerup', () => {
            bg.setFillStyle(hoverColor);
            container.setScale(1.05);
            
            // 지정된 콜백 함수 실행
            if (callback) callback();
        });

        return container;
    }
}