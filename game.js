/**
 * UTC2Hand - Mini-Game: BLOCKLASH (Săn Xu Giảm Giá)
 * Yêu cầu tài liệu:
 * - Chơi Blocklash
 * - Trên 1000 điểm sẽ được cộng 10 xu
 * - 1000 xu = 1.000 VNĐ giảm tiền giao dịch
 * - Thiết kế sôi động, đồ họa vật lý particle nảy nổ đã mắt, âm thanh đã tai
 */

class BlocklashGame {
    constructor(canvasId, onRewardCallback) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.onReward = onRewardCallback;

        this.width = this.canvas.width = 640;
        this.height = this.canvas.height = 420;

        this.state = 'idle'; // 'idle', 'playing', 'paused', 'gameover', 'victory'
        this.score = 0;
        this.coinsEarned = 0;
        this.hasClaimed1000Reward = false;
        this.combo = 0;
        this.comboTimer = 0;
        this.shakeTimer = 0;

        // Thanh đỡ (Paddle)
        this.paddle = {
            width: 110,
            height: 14,
            x: this.width / 2 - 55,
            y: this.height - 30,
            speed: 8,
            dx: 0
        };

        // Bóng vật lý (Bouncing Ball)
        this.ball = {
            x: this.width / 2,
            y: this.height - 50,
            radius: 7,
            vx: 4,
            vy: -4,
            speed: 5.5,
            trail: []
        };

        // Gạch Neon (Blocks)
        this.blocks = [];
        this.particles = [];
        this.floatingTexts = [];

        this.keys = {};
        this.initControls();
        this.setupBlocks();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    initControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' && this.state !== 'playing') {
                this.startGame();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Hỗ trợ chuột và cảm ứng kéo thanh trượt
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.state !== 'playing') return;
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) * (this.width / rect.width);
            this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, mouseX - this.paddle.width / 2));
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.state !== 'playing' || !e.touches[0]) return;
            const rect = this.canvas.getBoundingClientRect();
            const touchX = (e.touches[0].clientX - rect.left) * (this.width / rect.width);
            this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, touchX - this.paddle.width / 2));
            e.preventDefault();
        }, { passive: false });
    }

    setupBlocks() {
        this.blocks = [];
        const rows = 5;
        const cols = 8;
        const blockW = 66;
        const blockH = 22;
        const padX = 10;
        const padY = 8;
        const offsetX = (this.width - (cols * (blockW + padX) - padX)) / 2;
        const offsetY = 45;

        const colors = [
            { fill: '#ff007f', border: '#ff77bb', points: 150, hp: 2, type: 'pink' },
            { fill: '#00f0ff', border: '#70ffff', points: 100, hp: 1, type: 'cyan' },
            { fill: '#ffe600', border: '#fff580', points: 200, hp: 1, type: 'gold' }, // Bonus Coin
            { fill: '#7928ca', border: '#b57aff', points: 80,  hp: 1, type: 'purple' },
            { fill: '#00ff88', border: '#88ffcc', points: 60,  hp: 1, type: 'green' }
        ];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const scheme = colors[r % colors.length];
                this.blocks.push({
                    x: offsetX + c * (blockW + padX),
                    y: offsetY + r * (blockH + padY),
                    w: blockW,
                    h: blockH,
                    hp: scheme.hp,
                    maxHp: scheme.hp,
                    fill: scheme.fill,
                    border: scheme.border,
                    points: scheme.points,
                    type: scheme.type,
                    alive: true
                });
            }
        }
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.combo = 0;
        this.hasClaimed1000Reward = false;
        this.setupBlocks();
        this.ball.x = this.width / 2;
        this.ball.y = this.height - 50;
        this.ball.vx = (Math.random() > 0.5 ? 4 : -4);
        this.ball.vy = -5;
        this.ball.trail = [];
        this.particles = [];
        this.floatingTexts = [];
        if (window.sound) window.sound.playClick();
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4.5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3.5,
                color,
                alpha: 1,
                life: 25 + Math.random() * 20
            });
        }
    }

    addFloatingText(text, x, y, color = '#ffe600') {
        this.floatingTexts.push({
            text, x, y, color,
            alpha: 1,
            vy: -1.2,
            life: 40
        });
    }

    update() {
        if (this.shakeTimer > 0) this.shakeTimer--;

        // Cập nhật phím di chuyển
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.paddle.x = Math.max(0, this.paddle.x - this.paddle.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            this.paddle.x = Math.min(this.width - this.paddle.width, this.paddle.x + this.paddle.speed);
        }

        if (this.state !== 'playing') return;

        // Cập nhật Combo Timer
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer === 0) this.combo = 0;
        }

        // Cập nhật vệt bóng (Trail)
        this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
        if (this.ball.trail.length > 8) this.ball.trail.shift();

        // Di chuyển bóng
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        // Va chạm tường trái/phải
        if (this.ball.x - this.ball.radius <= 0) {
            this.ball.x = this.ball.radius;
            this.ball.vx *= -1;
            if (window.sound) window.sound.playBlockHit(0.8);
        } else if (this.ball.x + this.ball.radius >= this.width) {
            this.ball.x = this.width - this.ball.radius;
            this.ball.vx *= -1;
            if (window.sound) window.sound.playBlockHit(0.8);
        }

        // Va chạm trần
        if (this.ball.y - this.ball.radius <= 0) {
            this.ball.y = this.ball.radius;
            this.ball.vy *= -1;
            if (window.sound) window.sound.playBlockHit(0.8);
        }

        // Rơi đáy (Mất bóng)
        if (this.ball.y - this.ball.radius > this.height) {
            this.state = 'gameover';
            if (window.sound) window.sound.playWarning();
        }

        // Va chạm thanh đỡ (Paddle)
        if (
            this.ball.y + this.ball.radius >= this.paddle.y &&
            this.ball.y - this.ball.radius <= this.paddle.y + this.paddle.height &&
            this.ball.x >= this.paddle.x &&
            this.ball.x <= this.paddle.x + this.paddle.width
        ) {
            this.ball.y = this.paddle.y - this.ball.radius;
            // Tính góc nảy dựa trên điểm tiếp xúc so với tâm thanh đỡ
            const hitOffset = (this.ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
            const maxAngle = Math.PI * 0.38;
            const bounceAngle = hitOffset * maxAngle;
            const currentSpeed = Math.min(8.5, Math.hypot(this.ball.vx, this.ball.vy) + 0.1);

            this.ball.vx = currentSpeed * Math.sin(bounceAngle);
            this.ball.vy = -currentSpeed * Math.cos(bounceAngle);

            if (window.sound) window.sound.playPaddleBounce();
        }

        // Va chạm với gạch (Blocks)
        let aliveCount = 0;
        for (const block of this.blocks) {
            if (!block.alive) continue;
            aliveCount++;

            if (
                this.ball.x + this.ball.radius >= block.x &&
                this.ball.x - this.ball.radius <= block.x + block.w &&
                this.ball.y + this.ball.radius >= block.y &&
                this.ball.y - this.ball.radius <= block.y + block.h
            ) {
                // Đổi hướng bóng
                const prevX = this.ball.x - this.ball.vx;
                if (prevX < block.x || prevX > block.x + block.w) {
                    this.ball.vx *= -1;
                } else {
                    this.ball.vy *= -1;
                }

                block.hp--;
                this.combo++;
                this.comboTimer = 70; // Giữ combo trong 70 frames

                if (block.hp <= 0) {
                    block.alive = false;
                    const bonusCombo = Math.floor(this.combo * 15);
                    const totalPoints = block.points + bonusCombo;
                    this.score += totalPoints;

                    this.createExplosion(block.x + block.w / 2, block.y + block.h / 2, block.fill);
                    this.addFloatingText(`+${totalPoints}`, block.x + block.w / 2, block.y, block.border);

                    if (this.combo >= 4) {
                        this.shakeTimer = 6;
                    }

                    if (window.sound) window.sound.playBlockHit(1 + (this.combo * 0.08));

                    // KIỂM TRA MỐC 1000 ĐIỂM -> THƯỞNG 10 XU THEO YÊU CẦU ĐỀ BÀI
                    if (this.score >= 1000 && !this.hasClaimed1000Reward) {
                        this.hasClaimed1000Reward = true;
                        this.coinsEarned += 10;
                        this.addFloatingText('★ ĐẠT 1000 ĐIỂM: +10 XU! ★', this.width / 2, this.height / 2 - 20, '#00ff88');
                        if (window.sound) window.sound.playCoin();
                        if (typeof this.onReward === 'function') {
                            this.onReward(10, this.score);
                        }
                    }
                } else {
                    if (window.sound) window.sound.playBlockHit(0.9);
                }
                break;
            }
        }

        if (aliveCount === 0) {
            this.state = 'victory';
            if (window.sound) window.sound.playSuccess();
        }

        // Cập nhật particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.alpha = Math.max(0, p.life / 40);
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Cập nhật floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.life--;
            ft.alpha = Math.max(0, ft.life / 40);
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    draw() {
        this.ctx.save();

        // Hiệu ứng rung màn hình khi combo lớn
        if (this.shakeTimer > 0) {
            const dx = (Math.random() - 0.5) * 6;
            const dy = (Math.random() - 0.5) * 6;
            this.ctx.translate(dx, dy);
        }

        // Nền Cyber UTC2 rực rỡ
        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        bgGrad.addColorStop(0, '#080a14');
        bgGrad.addColorStop(1, '#11172a');
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Lưới Cyber mờ
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.width; x += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        // Vẽ vệt bóng (Trail)
        for (let i = 0; i < this.ball.trail.length; i++) {
            const pt = this.ball.trail[i];
            const ratio = (i + 1) / this.ball.trail.length;
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, this.ball.radius * ratio, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 240, 255, ${ratio * 0.35})`;
            this.ctx.fill();
        }

        // Vẽ bóng chính có ánh sáng neon
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#00f0ff';
        this.ctx.shadowBlur = 12;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Vẽ thanh đỡ (Paddle)
        const padGrad = this.ctx.createLinearGradient(this.paddle.x, 0, this.paddle.x + this.paddle.width, 0);
        padGrad.addColorStop(0, '#00f0ff');
        padGrad.addColorStop(0.5, '#7928ca');
        padGrad.addColorStop(1, '#ff007f');
        this.ctx.fillStyle = padGrad;
        this.ctx.shadowColor = '#00f0ff';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 7);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Vẽ các khối gạch
        for (const block of this.blocks) {
            if (!block.alive) continue;
            this.ctx.fillStyle = block.fill;
            this.ctx.strokeStyle = block.border;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.roundRect(block.x, block.y, block.w, block.h, 4);
            this.ctx.fill();
            this.ctx.stroke();

            // Nếu gạch có 2 HP, vẽ vạch nứt
            if (block.hp > 1) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(block.x + block.w / 2, block.y + block.h / 2, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Vẽ tia nổ particles
        for (const p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        // Vẽ chữ bay floating texts
        for (const ft of this.floatingTexts) {
            this.ctx.fillStyle = ft.color;
            this.ctx.globalAlpha = ft.alpha;
            this.ctx.font = 'bold 15px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ft.text, ft.x, ft.y);
        }
        this.ctx.globalAlpha = 1;

        // Giao diện HUD trên cùng (Điểm số, Combo, Xu)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Điểm: ${this.score}`, 16, 26);

        // Hiển thị mốc thưởng 1000 điểm
        if (this.score >= 1000) {
            this.ctx.fillStyle = '#00ff88';
            this.ctx.fillText(`★ ĐÃ ĐẠT MỐC: +10 XU`, 140, 26);
        } else {
            this.ctx.fillStyle = '#a0aec0';
            this.ctx.font = '13px sans-serif';
            this.ctx.fillText(`Mục tiêu: 1000đ để nhận 10 xu (${Math.max(0, 1000 - this.score)}đ nữa)`, 140, 26);
        }

        if (this.combo > 1) {
            this.ctx.fillStyle = '#ff007f';
            this.ctx.font = 'bold 15px sans-serif';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`COMBO x${this.combo}!`, this.width - 16, 26);
        }

        // Trạng thái màn hình dừng / Game Over / Thắng
        if (this.state === 'idle') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#00f0ff';
            this.ctx.font = 'bold 28px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BLOCKLASH - SĂN XU UTC2', this.width / 2, this.height / 2 - 20);
            this.ctx.fillStyle = '#e2e8f0';
            this.ctx.font = '15px sans-serif';
            this.ctx.fillText('Di chuột hoặc phím Trái/Phải để điều khiển', this.width / 2, this.height / 2 + 15);
            this.ctx.fillStyle = '#ffe600';
            this.ctx.fillText('Đạt trên 1000 điểm nhận ngay 10 xu đổi tiền!', this.width / 2, this.height / 2 + 40);
            this.ctx.fillStyle = '#00ff88';
            this.ctx.font = 'bold 16px sans-serif';
            this.ctx.fillText('[ Nhấn SPACE hoặc Click nút BẮT ĐẦU ]', this.width / 2, this.height / 2 + 80);
        } else if (this.state === 'gameover') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#ff3366';
            this.ctx.font = 'bold 30px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER!', this.width / 2, this.height / 2 - 25);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px sans-serif';
            this.ctx.fillText(`Tổng điểm của bạn: ${this.score}`, this.width / 2, this.height / 2 + 10);
            if (this.score >= 1000) {
                this.ctx.fillStyle = '#00ff88';
                this.ctx.fillText(`Chúc mừng! Bạn đã tích lũy thành công 10 xu vào ví!`, this.width / 2, this.height / 2 + 35);
            }
            this.ctx.fillStyle = '#00f0ff';
            this.ctx.font = 'bold 15px sans-serif';
            this.ctx.fillText('Nhấn SPACE hoặc nút Chơi lại để săn tiếp!', this.width / 2, this.height / 2 + 75);
        } else if (this.state === 'victory') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#00ff88';
            this.ctx.font = 'bold 32px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CHIẾN THẮNG TUYỆT ĐỐI!', this.width / 2, this.height / 2 - 25);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px sans-serif';
            this.ctx.fillText(`Bạn đã phá sạch toàn bộ bảng gạch! Điểm: ${this.score}`, this.width / 2, this.height / 2 + 15);
            this.ctx.fillStyle = '#00f0ff';
            this.ctx.font = 'bold 15px sans-serif';
            this.ctx.fillText('Nhấn SPACE để chơi lại màn mới!', this.width / 2, this.height / 2 + 65);
        }

        this.ctx.restore();
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}

window.BlocklashGame = BlocklashGame;

