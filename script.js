const workspace = document.getElementById("workspace");
const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

canvas.width = workspace.clientWidth;
canvas.height = workspace.clientHeight;

let drawingEnabled = false;
let drawing = false;

// ---- CONNECT TO SERVER ----
const socket = io();

// This is where we store the global data
let globalData = null;

// Receive data when connecting
socket.on("load", data => {
    globalData = data;
    loadWorkspaceFromData(data);
});

// Receive updates from others
socket.on("update", data => {
    globalData = data;
    workspace.innerHTML = "";
    workspace.appendChild(canvas);
    loadWorkspaceFromData(data);
});

/* ---------------------------
   SAVE TO SERVER
---------------------------- */
function sendUpdate() {
    const data = collectWorkspaceData();
    socket.emit("update", data);
}

/* ---------------------------
   BUILD DATA FROM WORKSPACE
---------------------------- */
function collectWorkspaceData() {
    const data = {
        bgLayers: [],
        texts: [],
        images: [],
        drawing: canvas.toDataURL()
    };

    document.querySelectorAll(".bg-layer").forEach(layer => {
        data.bgLayers.push({
            color: layer.style.background,
            opacity: layer.style.opacity
        });
    });

    document.querySelectorAll(".text-element").forEach(el => {
        data.texts.push({
            text: el.textContent,
            left: el.style.left,
            top: el.style.top,
            color: el.style.color,
            fontSize: el.style.fontSize
        });
    });

    document.querySelectorAll("#workspace img").forEach(img => {
        data.images.push({
            src: img.src,
            left: img.style.left,
            top: img.style.top,
            width: img.style.width
        });
    });

    return data;
}

/* ---------------------------
   LOAD WORKSPACE FROM DATA
---------------------------- */
function loadWorkspaceFromData(data) {

    data.bgLayers.forEach(layer => {
        const div = document.createElement("div");
        div.className = "bg-layer";
        div.style.background = layer.color;
        div.style.opacity = layer.opacity;
        workspace.appendChild(div);
    });

    data.texts.forEach(t => {
        const div = document.createElement("div");
        div.className = "text-element";
        div.style.left = t.left;
        div.style.top = t.top;
        div.style.color = t.color;
        div.style.fontSize = t.fontSize;
        div.textContent = t.text;

        div.contentEditable = "true";
        div.addEventListener("input", sendUpdate);

        makeDraggable(div);
        workspace.appendChild(div);
    });

    data.images.forEach(i => {
        const img = document.createElement("img");
        img.src = i.src;
        img.style.left = i.left;
        img.style.top = i.top;
        img.style.width = i.width;
        makeDraggable(img);
        workspace.appendChild(img);
    });

    if (data.drawing) {
        const img = new Image();
        img.src = data.drawing;
        img.onload = () => ctx.drawImage(img, 0, 0);
    }
}

/* ---------------------------
   BACKGROUND
---------------------------- */
function changeBG() {
    const color = document.getElementById("bgColorPicker").value;
    const layer = document.createElement("div");
    layer.className = "bg-layer";
    layer.style.background = color;
    layer.style.opacity = "0.5";
    workspace.appendChild(layer);
    sendUpdate();
}

/* ---------------------------
   TEXT
---------------------------- */
function addText() {
    const text = document.getElementById("textInput").value;
    if (!text.trim()) return;

    const div = document.createElement("div");
    div.className = "text-element";
    div.style.left = "50px";
    div.style.top = "50px";
    div.style.fontSize = "24px";
    div.style.color = "black";
    div.textContent = text;

    div.contentEditable = "true";
    div.addEventListener("input", sendUpdate);

    makeDraggable(div);
    workspace.appendChild(div);
    sendUpdate();
}

/* ---------------------------
   IMAGES
---------------------------- */
function addImage() {
    const file = document.getElementById("imageInput").files[0];
    if (!file) return;

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.width = "200px";
    img.style.left = Math.random() * (workspace.clientWidth - 200) + "px";
    img.style.top = Math.random() * (workspace.clientHeight - 200) + "px";

    makeDraggable(img);
    workspace.appendChild(img);
    sendUpdate();
}

function spamImages() {
    const files = document.getElementById("spamInput").files;
    if (!files.length) return;

    for (const file of files) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.style.width = "120px";
        img.style.left = Math.random() * (workspace.clientWidth - 120) + "px";
        img.style.top = Math.random() * (workspace.clientHeight - 120) + "px";
        makeDraggable(img);
        workspace.appendChild(img);
    }
    sendUpdate();
}

/* ---------------------------
   DRAGGING
---------------------------- */
function makeDraggable(el) {
    el.onmousedown = function(e) {
        const shiftX = e.clientX - el.getBoundingClientRect().left;
        const shiftY = e.clientY - el.getBoundingClientRect().top;

        function moveAt(e) {
            el.style.left = e.clientX - shiftX + "px";
            el.style.top = e.clientY - shiftY + "px";
        }

        document.addEventListener("mousemove", moveAt);

        document.onmouseup = () => {
            document.removeEventListener("mousemove", moveAt);
            sendUpdate();
        };
    };
}

/* ---------------------------
   DRAWING
---------------------------- */
function toggleDraw() {
    drawingEnabled = !drawingEnabled;
    alert("Drawing: " + (drawingEnabled ? "ON" : "OFF"));
}

canvas.addEventListener("mousedown", e => {
    if (!drawingEnabled) return;
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener("mousemove", e => {
    if (!drawingEnabled || !drawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
});

canvas.addEventListener("mouseup", () => {
    drawing = false;
    sendUpdate();
});

/* ---------------------------
   WARNING
---------------------------- */
function dismissWarning() {
    document.getElementById("apocalypseWarning").style.display = "none";
}
