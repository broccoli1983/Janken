

(function () {

	// 全体の寸法
	var BOOK_WIDTH = 830;
	var BOOK_HEIGHT = 260;

	// 本１ページの寸法
	var PAGE_WIDTH = 400;
	var PAGE_HEIGHT = 250;

	// 本の上端と紙の間の垂直方向の間隔
	var PAGE_Y = (BOOK_HEIGHT - PAGE_HEIGHT) / 2;

	// キャンバスのサイズは、本の寸法に等しい
	var CANVAS_PADDING = 60;

	var page = 0;

	var canvas = document.getElementById("pageflip-canvas");
	var context = canvas.getContext("2d");

	var mouse = { x: 0, y: 0 };

	var flips = [];

	var book = document.getElementById("book");

	// List of all the page elements in the DOM
	var pages = book.getElementsByTagName("section");

	//DOM内のすべてのページ要素のリスト
	for (var i = 0, len = pages.length; i < len; i++) {
		pages[i].style.zIndex = len - i;

		flips.push({
			//現在の場所（左- 1から右 + 1）
			progress: 1,
			// 目標値
			target: 1,
			// 関連するページDOM要素
			page: pages[i],
			//ページがドラッグされている間はTrue
			dragging: false
		});
	}

	//本のサイズに合わせてキャンバスのサイズを変更します
	canvas.width = BOOK_WIDTH + (CANVAS_PADDING * 2);
	canvas.height = BOOK_HEIGHT + (CANVAS_PADDING * 2);

	// パディングが本の周りに均等に広がるようにキャンバスをオフセット
	canvas.style.top = -CANVAS_PADDING + "px";
	canvas.style.left = -CANVAS_PADDING + "px";

	// ページめくりを1秒間に60回レンダリングする
	//レンダリングは、コンピュータプログラミングを使って元となる数値データを計算し、
	//画像や音楽を描写するための作業のことです。
	setInterval(render, 1000 / 60);

	document.addEventListener("mousemove", mouseMoveHandler, false);
	document.addEventListener("mousedown", mouseDownHandler, false);
	document.addEventListener("mouseup", mouseUpHandler, false);

	function mouseMoveHandler(event) {
		//本の背の上部が0,0になるようにマウスの位置をオフセットする
		mouse.x = event.clientX - book.offsetLeft - (BOOK_WIDTH / 2);
		mouse.y = event.clientY - book.offsetTop;
	}

	function mouseDownHandler(event) {
		//マウスポインタが本の中にあることを確認
		if (Math.abs(mouse.x) < PAGE_WIDTH) {
			if (mouse.x < 0 && page - 1 >= 0) {
				//左側にいます。前のページをドラッグ
				flips[page - 1].dragging = true;
			}
			else if (mouse.x > 0 && page + 1 < flips.length) {
				// 右側にいます。現在のページをドラッグ
				flips[page].dragging = true;
			}
		}

		//テキストの選択を防ぐ
		event.preventDefault();
	}

	function mouseUpHandler(event) {
		for (var i = 0; i < flips.length; i++) {
			// ドラッグしてページを捲る
			if (flips[i].dragging) {
				// どのページに移動する必要があるかを把握
				if (mouse.x < 0) {
					flips[i].target = -1;
					page = Math.min(page + 1, flips.length);
				}
				else {
					flips[i].target = 1;
					page = Math.max(page - 1, 0);
				}
			}

			flips[i].dragging = false;
		}
	}

	function render() {

		// キャンバス内のすべてのピクセルをリセット
		context.clearRect(0, 0, canvas.width, canvas.height);

		for (var i = 0, len = flips.length; i < len; i++) {
			var flip = flips[i];

			if (flip.dragging) {
				flip.target = Math.max(Math.min(mouse.x / PAGE_WIDTH, 1), -1);
			}

			//目標値への進捗を容易にする
			flip.progress += (flip.target - flip.progress) * 0.2;

			// フリップがドラッグされているか、本の途中にある場合は、それをレンダリング
			if (flip.dragging || Math.abs(flip.progress) < 0.997) {
				drawFlip(flip);
			}

		}

	}

	function drawFlip(flip) {
		// Strength of the fold is strongest in the middle of the book
		var strength = 1 - Math.abs(flip.progress);

		// Width of the folded paper
		var foldWidth = (PAGE_WIDTH * 0.5) * (1 - flip.progress);

		// X position of the folded paper
		var foldX = PAGE_WIDTH * flip.progress + foldWidth;

		// How far the page should outdent vertically due to perspective
		var verticalOutdent = 20 * strength;

		// The maximum width of the left and right side shadows
		var paperShadowWidth = (PAGE_WIDTH * 0.5) * Math.max(Math.min(1 - flip.progress, 0.5), 0);
		var rightShadowWidth = (PAGE_WIDTH * 0.5) * Math.max(Math.min(strength, 0.5), 0);
		var leftShadowWidth = (PAGE_WIDTH * 0.5) * Math.max(Math.min(strength, 0.5), 0);


		// Change page element width to match the x position of the fold
		flip.page.style.width = Math.max(foldX, 0) + "px";

		context.save();
		context.translate(CANVAS_PADDING + (BOOK_WIDTH / 2), PAGE_Y + CANVAS_PADDING);


		// Draw a sharp shadow on the left side of the page
		context.strokeStyle = 'rgba(0,0,0,' + (0.05 * strength) + ')';
		context.lineWidth = 30 * strength;
		context.beginPath();
		context.moveTo(foldX - foldWidth, -verticalOutdent * 0.5);
		context.lineTo(foldX - foldWidth, PAGE_HEIGHT + (verticalOutdent * 0.5));
		context.stroke();


		// Right side drop shadow
		var rightShadowGradient = context.createLinearGradient(foldX, 0, foldX + rightShadowWidth, 0);
		rightShadowGradient.addColorStop(0, 'rgba(0,0,0,' + (strength * 0.2) + ')');
		rightShadowGradient.addColorStop(0.8, 'rgba(0,0,0,0.0)');

		context.fillStyle = rightShadowGradient;
		context.beginPath();
		context.moveTo(foldX, 0);
		context.lineTo(foldX + rightShadowWidth, 0);
		context.lineTo(foldX + rightShadowWidth, PAGE_HEIGHT);
		context.lineTo(foldX, PAGE_HEIGHT);
		context.fill();


		// Left side drop shadow
		var leftShadowGradient = context.createLinearGradient(foldX - foldWidth - leftShadowWidth, 0, foldX - foldWidth, 0);
		leftShadowGradient.addColorStop(0, 'rgba(0,0,0,0.0)');
		leftShadowGradient.addColorStop(1, 'rgba(0,0,0,' + (strength * 0.15) + ')');

		context.fillStyle = leftShadowGradient;
		context.beginPath();
		context.moveTo(foldX - foldWidth - leftShadowWidth, 0);
		context.lineTo(foldX - foldWidth, 0);
		context.lineTo(foldX - foldWidth, PAGE_HEIGHT);
		context.lineTo(foldX - foldWidth - leftShadowWidth, PAGE_HEIGHT);
		context.fill();


		// Gradient applied to the folded paper (highlights & shadows)
		var foldGradient = context.createLinearGradient(foldX - paperShadowWidth, 0, foldX, 0);
		foldGradient.addColorStop(0.35, '#fafafa');
		foldGradient.addColorStop(0.73, '#eeeeee');
		foldGradient.addColorStop(0.9, '#fafafa');
		foldGradient.addColorStop(1.0, '#e2e2e2');

		context.fillStyle = foldGradient;
		context.strokeStyle = 'rgba(0,0,0,0.06)';
		context.lineWidth = 0.5;

		// Draw the folded piece of paper
		context.beginPath();
		context.moveTo(foldX, 0);
		context.lineTo(foldX, PAGE_HEIGHT);
		context.quadraticCurveTo(foldX, PAGE_HEIGHT + (verticalOutdent * 2), foldX - foldWidth, PAGE_HEIGHT + verticalOutdent);
		context.lineTo(foldX - foldWidth, -verticalOutdent);
		context.quadraticCurveTo(foldX, -verticalOutdent * 2, foldX, 0);

		context.fill();
		context.stroke();


		context.restore();
	}

})();


