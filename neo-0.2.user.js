// ==UserScript==
// @name         neo
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  快速自动跳过学习过程
// @author       木木编写，慕阳修改
// @match        https://neostudyonline.com.cn/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // 保存原始的fetch方法
    let originalFetch = window.fetch;
    //定义全局window空数组用来存储题目中句子内容
    window.sentences = [];

    // 保存原始的XMLHttpRequest构造函数
    let originalXMLHttpRequest = window.XMLHttpRequest;

    // 重写XMLHttpRequest构造函数
    window.XMLHttpRequest = function() {
        let xhr = new originalXMLHttpRequest();

        // 保存原始的open和send方法
        let originalOpen = xhr.open;
        let originalSend = xhr.send;

        // 重写open方法
        xhr.open = function() {
            // console.log('XHR opened with arguments:', arguments);
            originalOpen.apply(this, arguments);
        };

        // 重写send方法
        xhr.send = function() {
            // console.log('XHR sent with arguments:', arguments);

            // 监听load事件
            this.addEventListener('load', function() {
                try {
                    // 获取响应的内容
                    let responseText = this.responseText;

                    // 如果url中包含了json,有可能是题目请求，载入json，看key是否有product_id,lesson_name,lesson_description
                    if (this.responseURL.includes('json')) {
                        // 将json转换为对象
                        let json = JSON.parse(responseText);

                        // 如果json中包含了product_id,lesson_name,lesson_description
                        if (json.product_id && json.lesson_name && json.lesson_description) {
                            if (json.lesson_description.indexOf('Speaking Practice') !== -1) {
                                // json.sr_database是一个数组['nice day' ,'hello morning']，里面包含了所有的句子，提取单词，将单词改成小写添加到sentences数组中
                                for (let sentence of json.sr_database) {
                                    let words = sentence.match(/\S+/g);
                                    for (let word of words) {
                                        sentences.push(word.toLowerCase());
                                    }
                                }
                            }
                        }
                    }

                    // 修改响应的内容
                    let modifiedResponseText = responseText.replace('旧字符串', '新字符串');

                    // 将修改后的内容设置为响应的内容
                    Object.defineProperty(this, 'responseText', {
                        value: modifiedResponseText
                    });
                } catch (error) {
                    // 如果发生错误，打印错误信息并调用原始的send方法
                    // console.error('Error occurred:', error);
                    originalSend.apply(this, arguments);
                }
            });

            originalSend.apply(this, arguments);
        };

        return xhr;
    };

    // 重写fetch方法
    window.fetch = async function() {
        try {
            // 打印url
            // console.log('url:', arguments[0]);

            // 调用原始的fetch方法
            let response = await originalFetch.apply(this, arguments);

            // 获取响应的内容
            let text = await response.text();

            // 修改响应的内容
            let modifiedText = text.replace('Hello', 'Goodbye');

            // 创建一个新的Response对象，将修改后的内容传递给这个对象
            let modifiedResponse = new Response(modifiedText, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });

            // 返回修改后的响应
            return modifiedResponse;
        } catch (error) {
            // 如果发生错误，打印错误信息并调用原始的fetch方法
            // console.error('Error occurred:', error);
            return originalFetch.apply(this, arguments);
        }
    };

    // 保存原始的console.log方法
    let originalLog = console.log;

    // 重写console.log方法
    console.log = function() {
        // 检查第一个参数是否是数组
        if (Array.isArray(arguments[0])) {
            // 获取数组
            let array = arguments[0];
            // console.log('log的是数组:', array);
            // 如果数组的长度大于0，并且数组内容都是字符串
            if (array.length > 0 && array.every(item => typeof item === 'string')) {
                // 将sentences数组中的内容添加到数组中
                array.push(...sentences);
            }
            // 如果数组的长度大于0，并且数组内容都是浮点数
            if (array.length > 0 && array.every(item => typeof item === 'number')) {
                // 将sentences数组长度个1添加到数组中
                array.push(...Array(sentences.length).fill(1));
            }
        }

        // 调用原始的console.log方法
        originalLog.apply(this, arguments);
    };

    // 保存原始的 createElement 方法

    //重写原生的音频播放方法
    window.HTMLAudioElement.prototype.play = function () {
        this.dispatchEvent(new Event('ended'));
    };
    //重写原生的视频播放方法
     window.HTMLVideoElement.prototype.play = function () {
        this.dispatchEvent(new Event('ended'));
    };



    //写一个方法，该方法执行时重写window的一些方法
    function rewrite() {
        // 重写window.onblur
        window.onblur = function () { };
        // 重写焦点方法，让网页无法知道焦点离开了界面
        document.hasFocus = function () {
            return true;
        };
        // 重写document.onvisibilitychange
        document.onvisibilitychange = function () { };

        // 阻止contextmenu事件
        window.oncontextmenu = function (event) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        };
    }
    //添加blur监听，当窗口失去焦点时执行rewrite方法，阻止页面暂停
    window.addEventListener('blur', function () {
        rewrite();
    });
    window.addEventListener('load', function () {

        // 获取pauseModal元素
        var pauseModal = document.getElementById('pauseModal');

        // 创建一个观察器实例
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    console.log('pauseModal style changed');
                }
            });
        });

        // 配置观察器
        var config = { attributes: true, attributeFilter: ['style'] };

        // 传入目标节点和观察选项
        observer.observe(pauseModal, config);
        const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

        navigator.mediaDevices.getUserMedia = async function(constraints) {
            // 如果请求的是音频流
            if (constraints.audio) {
                // 创建一个 AudioContext 对象
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();

                // 加载你的音频文件
                const response = await originalFetch('https://neo.dyned.com.cn/cctv-assets/000009.mp3');
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                // 创建一个 MediaStreamAudioSourceNode 对象
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;

                // 将 source 连接到 AudioContext
                const destination = audioContext.createMediaStreamDestination();
                source.connect(destination);

                // 创建一个 MediaStreamTrack 对象
                const track = destination.stream.getTracks()[0];

                // 创建一个新的 MediaStream 对象
                const newStream = new MediaStream([track]);

                // 开始播放
                source.start();

                // 返回新的 MediaStream 对象
                return newStream;
            } else {
                // 如果请求的不是音频流，调用原始的 getUserMedia 方法
                return originalGetUserMedia(constraints);
            }
        };
    });

    // 选择所有带有 CSS 动画的元素
    var elementsWithAnimation = document.querySelectorAll('*[style*="animation"]');

    // 加速所有动画
    elementsWithAnimation.forEach(function(element) {
        // 获取当前元素的动画样式
        var currentAnimation = element.style.animation;

        // 检查是否有多个动画
        var animations = currentAnimation.split(',');

        // 遍历所有动画，加速每个动画的持续时间
        animations.forEach(function(animation, index) {
            var parts = animation.trim().split(/\s+/);
            var durationIndex = parts.findIndex(part => part.includes('s'));
            if (durationIndex !== -1) {
                var duration = parseFloat(parts[durationIndex]);
                var unit = parts[durationIndex].replace(/[0-9.]/g, '');
                // 加速动画持续时间
                parts[durationIndex] = (duration / 10) + unit; // 将持续时间减半
                animations[index] = parts.join(' ');
            }
        });

        // 更新元素的动画样式
        element.style.animation = animations.join(',');
    });

})();