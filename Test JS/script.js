var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');

var painting = false;
var erasing = false;
var color = '#000000';
var pdfDoc = null;
var pageNum = 1;
var zoomLevel = 1.0;
var regularZoom = 1.0;
var inAction = false;

function renderPage(num) {
    pdfDoc.getPage(num).then(function(page) {
        var viewport = page.getViewport({
            scale: zoomLevel
        });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        var renderContext = {
            canvasContext: ctx,
            viewport: viewport,
        };
        var renderTask = page.render(renderContext);
    });
}

document.getElementById('colorPicker').onchange = function() {
    color = this.value;
}

function startAction(e) {
    ctx.save();
    inAction = true;
    if (erasing) {
        startErase(e);
    } else {
        startDraw(e);
    }
}

function endAction(e) {
    inAction = false;
    if (erasing) {
        endErase();
    } else {
        endDraw();
    }
}

function action(e) {
    if (!inAction) return;
    if (erasing) {
        erase(e);
    } else {
        draw(e);
    }
}

function startDraw(e) {
    painting = true;
    draw(e);
}

function endDraw() {
    painting = false;
    ctx.beginPath();
}

function draw(e) {
    if (!painting) return;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function startErase(e) {
    erasing = true;
    erase(e);
}

function endErase() {
    erasing = false;
    ctx.beginPath();
}

function erase(e) {
    if (!erasing) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';

    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function saveCanvas() {
    var imgData = canvas.toDataURL('image/png');
    var pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 0, 0);
    pdf.save('DownloadPage.pdf');
}

function uploadPDF() {
    var pdfUploader = document.getElementById('pdfUploader');
    pdfUploader.click();
    pdfUploader.onchange = function(e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            var typedarray = new Uint8Array(this.result);
            pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
                pdfDoc = pdf;
                renderPage(pageNum);
            });
        };
        reader.readAsArrayBuffer(file);
    }
}

function goToPrevPage() {
    if (pdfDoc !== null && pageNum > 1) {
        pageNum--;
        renderPage(pageNum);
    }
}

function goToNextPage() {
    if (pdfDoc !== null && pageNum < pdfDoc.numPages) {
        pageNum++;
        renderPage(pageNum);
    }
}

function zoomIn() {
    zoomLevel += 0.1;
    renderPage(pageNum);
}

function zoomOut() {
    if (zoomLevel > 0.2) {
        zoomLevel -= 0.1;
        renderPage(pageNum);
    }
}

function resumeWriting() {
    erasing = false;
    painting = true;
    ctx.globalCompositeOperation = 'source-over';
}

function resumeErasing() { // consistency, js lambda is disgusting
    erasing = true;
    painting = false;
}

function undo() {
    console.log("Restored");
    ctx.restore();
}

document.getElementById('clearCanvas').addEventListener('click', clearCanvas);
document.getElementById('saveCanvas').addEventListener('click', saveCanvas);
document.getElementById('uploadPDF').addEventListener('click', uploadPDF);
document.getElementById('prevPage').addEventListener('click', goToPrevPage);
document.getElementById('nextPage').addEventListener('click', goToNextPage);
document.getElementById('erase').addEventListener('click', resumeErasing);
document.getElementById('draw').addEventListener('click', resumeWriting);
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('zoomIn').addEventListener('click', zoomIn);
document.getElementById('zoomOut').addEventListener('click', zoomOut);
canvas.addEventListener('mousedown', startAction);
canvas.addEventListener('mouseup', endAction);
canvas.addEventListener('mousemove', action);