// ==UserScript==
// @name         绕过人脸验证
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  绕过网站上的人脸验证
// @author       慕阳
// @match        https://study.hx.cn/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 保存原始的 open 和 send 方法
    var open = XMLHttpRequest.prototype.open;
    var send = XMLHttpRequest.prototype.send;

    // 重写 open 方法，保存请求的 URL
    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        open.apply(this, arguments);
    };

    // 重写 send 方法，添加事件监听器
    XMLHttpRequest.prototype.send = function(data) {
        this.addEventListener('readystatechange', function() {
            try {
                // 检查请求是否完成且成功，并且 URL 包含特定路径
                if (this.readyState === 4 && this.status === 200 && this._url.includes('/face/detect/video/')) {
                    console.log('拦截请求到 /face/detect/video/');
                    console.log('原始响应:', this.responseText);

                    // 使用 Object.defineProperty 拦截和修改 responseText
                    Object.defineProperty(this, 'responseText', {
                        get: function() {
                            return JSON.stringify({ status: 'success' });
                        }
                    });

                    console.log('修改后的响应:', this.responseText);
                }
            } catch (error) {
                console.error('处理拦截请求时出错:', error);
            }
        }, false);
        send.apply(this, arguments);
    };
})();