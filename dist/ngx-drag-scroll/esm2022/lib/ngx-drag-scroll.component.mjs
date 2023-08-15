import { ElementRef, Component, Renderer2, Input, Output, EventEmitter, ViewChild, ContentChildren, QueryList, Inject, HostBinding, HostListener } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DragScrollItemDirective } from './ngx-drag-scroll-item';
import * as i0 from "@angular/core";
class DragScrollComponent {
    /**
     * Is the user currently dragging the element
     */
    get isDragging() {
        return this._isDragging;
    }
    get currIndex() {
        return this._index;
    }
    set currIndex(value) {
        if (value !== this._index) {
            this._index = value;
            this.indexChanged.emit(value);
        }
    }
    /**
     * Whether the scrollbar is hidden
     */
    get scrollbarHidden() {
        return this._scrollbarHidden;
    }
    set scrollbarHidden(value) {
        this._scrollbarHidden = value;
    }
    /**
     * Whether horizontally and vertically draging and scrolling is be disabled
     */
    get disabled() {
        return this._disabled;
    }
    set disabled(value) {
        this._disabled = value;
    }
    /**
     * Whether horizontally dragging and scrolling is be disabled
     */
    get xDisabled() {
        return this._xDisabled;
    }
    set xDisabled(value) {
        this._xDisabled = value;
    }
    /**
     * Whether vertically dragging and scrolling events is disabled
     */
    get yDisabled() {
        return this._yDisabled;
    }
    set yDisabled(value) {
        this._yDisabled = value;
    }
    /**
     * Whether scrolling horizontally with mouse wheel is enabled
     */
    get xWheelEnabled() {
        return this._xWheelEnabled;
    }
    set xWheelEnabled(value) {
        this._xWheelEnabled = value;
    }
    get dragDisabled() {
        return this._dragDisabled;
    }
    set dragDisabled(value) {
        this._dragDisabled = value;
    }
    get snapDisabled() {
        return this._snapDisabled;
    }
    set snapDisabled(value) {
        this._snapDisabled = value;
    }
    get snapOffset() {
        return this._snapOffset;
    }
    set snapOffset(value) {
        this._snapOffset = value;
    }
    get snapDuration() {
        return this._snapDuration;
    }
    set snapDuration(value) {
        this._snapDuration = value;
    }
    constructor(_elementRef, _renderer, _document) {
        this._elementRef = _elementRef;
        this._renderer = _renderer;
        this._document = _document;
        this._index = 0;
        this._scrollbarHidden = false;
        this._disabled = false;
        this._xDisabled = false;
        this._xWheelEnabled = false;
        this._yDisabled = false;
        this._dragDisabled = false;
        this._snapDisabled = false;
        this._snapOffset = 0;
        this._snapDuration = 500;
        this._isDragging = false;
        /**
         * Is the user currently pressing the element
         */
        this.isPressed = false;
        /**
         * Is the user currently scrolling the element
         */
        this.isScrolling = false;
        this.scrollTimer = -1;
        this.scrollToTimer = -1;
        /**
         * The x coordinates on the element
         */
        this.downX = 0;
        /**
         * The y coordinates on the element
         */
        this.downY = 0;
        this.displayType = 'block';
        this.elWidth = null;
        this.elHeight = null;
        this._pointerEvents = 'auto';
        this.scrollbarWidth = null;
        this.isAnimating = false;
        this.prevChildrenLength = 0;
        this.indexBound = 0;
        this.rtl = false;
        this.dsInitialized = new EventEmitter();
        this.indexChanged = new EventEmitter();
        this.reachesLeftBound = new EventEmitter();
        this.reachesRightBound = new EventEmitter();
        this.snapAnimationFinished = new EventEmitter();
        this.dragStart = new EventEmitter();
        this.dragEnd = new EventEmitter();
        this.scrollbarWidth = `${this.getScrollbarWidth()}px`;
    }
    ngOnChanges() {
        this.setScrollBar();
        if (this.xDisabled || this.disabled || this._scrollbarHidden) {
            this.disableScroll('x');
        }
        else {
            this.enableScroll('x');
        }
        if (this.yDisabled || this.disabled) {
            this.disableScroll('y');
        }
        else {
            this.enableScroll('y');
        }
    }
    ngAfterViewInit() {
        // auto assign computed css
        this._renderer.setAttribute(this._contentRef.nativeElement, 'drag-scroll', 'true');
        this.displayType = 'block';
        // typeof window?.getComputedStyle !== 'undefined'
        //   ? window.getComputedStyle(this._elementRef.nativeElement)?.display
        //   : 'block';
        this._renderer.setStyle(this._contentRef.nativeElement, 'display', this.displayType);
        this._renderer.setStyle(this._contentRef.nativeElement, 'whiteSpace', 'noWrap');
        // store ele width height for later user
        this.markElDimension();
        this._renderer.setStyle(this._contentRef.nativeElement, 'width', this.elWidth);
        this._renderer.setStyle(this._contentRef.nativeElement, 'height', this.elHeight);
        if (this.wrapper) {
            this.checkScrollbar();
        }
        this._onMouseDownListener = this._renderer.listen(this._contentRef.nativeElement, 'mousedown', this.onMouseDownHandler.bind(this));
        this._onScrollListener = this._renderer.listen(this._contentRef.nativeElement, 'scroll', this.onScrollHandler.bind(this));
        // prevent Firefox from dragging images
        this._onDragStartListener = this._renderer.listen(this._contentRef.nativeElement, 'dragstart', (e) => {
            e.preventDefault();
        });
        this.checkNavStatus();
        this.dsInitialized.emit();
        this.adjustMarginToLastChild();
        console.log("TEST");
        // this.rtl = (typeof window?.getComputedStyle !== 'undefined'
        //     ? window?.getComputedStyle(this._elementRef.nativeElement)?.getPropertyValue('direction')
        //     : 'rtl'
        // ) === 'rtl';
    }
    ngAfterViewChecked() {
        // avoid extra checks
        if (this._children.length !== this.prevChildrenLength) {
            this.markElDimension();
            this.checkScrollbar();
            this.prevChildrenLength = this._children.length;
            this.checkNavStatus();
        }
    }
    ngOnDestroy() {
        this._renderer.setAttribute(this._contentRef.nativeElement, 'drag-scroll', 'false');
        if (this._onMouseDownListener) {
            this._onMouseDownListener = this._onMouseDownListener();
        }
        if (this._onScrollListener) {
            this._onScrollListener = this._onScrollListener();
        }
        if (this._onDragStartListener) {
            this._onDragStartListener = this._onDragStartListener();
        }
    }
    onMouseMoveHandler(event) {
        this.onMouseMove(event);
    }
    onMouseMove(event) {
        if (event.clientX === this.downX && event.clientY === this.downY) {
            // Ignore 'mousemove" event triggered at the same coordinates that the last mousedown event (consequence of window resize)
            return;
        }
        if (this.isPressed && !this.disabled) {
            // Workaround for prevent scroll stuck if browser lost focus
            // MouseEvent.buttons not support by Safari
            // eslint-disable-next-line import/no-deprecated
            if (!event.buttons && !event.which) {
                return this.onMouseUpHandler(event);
            }
            this._pointerEvents = 'none';
            this._setIsDragging(true);
            // Drag X
            if (!this.xDisabled && !this.dragDisabled) {
                const clientX = event.clientX;
                this._contentRef.nativeElement.scrollLeft =
                    this._contentRef.nativeElement.scrollLeft - clientX + this.downX;
                this.downX = clientX;
            }
            // Drag Y
            if (!this.yDisabled && !this.dragDisabled) {
                const clientY = event.clientY;
                this._contentRef.nativeElement.scrollTop =
                    this._contentRef.nativeElement.scrollTop - clientY + this.downY;
                this.downY = clientY;
            }
        }
    }
    onMouseDownHandler(event) {
        const dragScrollItem = this.locateDragScrollItem(event.target);
        if (dragScrollItem && dragScrollItem.dragDisabled) {
            return;
        }
        const isTouchEvent = event.type === 'touchstart';
        this._startGlobalListening(isTouchEvent);
        this.isPressed = true;
        const mouseEvent = event;
        this.downX = mouseEvent.clientX;
        this.downY = mouseEvent.clientY;
        clearTimeout(this.scrollToTimer);
    }
    onScrollHandler() {
        this.checkNavStatus();
        if (!this.isPressed && !this.isAnimating && !this.snapDisabled) {
            this.isScrolling = true;
            clearTimeout(this.scrollTimer);
            this.scrollTimer = setTimeout(() => {
                this.isScrolling = false;
                this.locateCurrentIndex(true);
            }, 500);
        }
        else {
            this.locateCurrentIndex();
        }
    }
    onMouseUpHandler(event) {
        if (this.isPressed) {
            this.isPressed = false;
            this._pointerEvents = 'auto';
            this._setIsDragging(false);
            if (!this.snapDisabled) {
                this.locateCurrentIndex(true);
            }
            else {
                this.locateCurrentIndex();
            }
            this._stopGlobalListening();
        }
    }
    /*
     * Nav button
     */
    moveLeft() {
        if (this.currIndex !== 0 || this.snapDisabled) {
            this.currIndex--;
            clearTimeout(this.scrollToTimer);
            this.scrollTo(this._contentRef.nativeElement, this.toChildrenLocation(), this.snapDuration);
        }
    }
    moveRight() {
        const container = this.wrapper || this.parentNode;
        const containerWidth = container ? container.clientWidth : 0;
        if (!this.isScrollReachesRightEnd() &&
            this.currIndex <
                this.maximumIndex(containerWidth, this._children.toArray())) {
            this.currIndex++;
            clearTimeout(this.scrollToTimer);
            this.scrollTo(this._contentRef.nativeElement, this.toChildrenLocation(), this.snapDuration);
        }
    }
    moveTo(index) {
        const container = this.wrapper || this.parentNode;
        const containerWidth = container ? container.clientWidth : 0;
        if (index >= 0 &&
            index !== this.currIndex &&
            this.currIndex <=
                this.maximumIndex(containerWidth, this._children.toArray())) {
            this.currIndex = Math.min(index, this.maximumIndex(containerWidth, this._children.toArray()));
            clearTimeout(this.scrollToTimer);
            this.scrollTo(this._contentRef.nativeElement, this.toChildrenLocation(), this.snapDuration);
        }
    }
    checkNavStatus() {
        setTimeout(() => {
            const onlyOneItem = Boolean(this._children.length <= 1);
            const containerIsLargerThanContent = Boolean(this._contentRef.nativeElement.scrollWidth <=
                this._contentRef.nativeElement.clientWidth);
            if (onlyOneItem || containerIsLargerThanContent) {
                // only one element
                this.reachesLeftBound.emit(true);
                this.reachesRightBound.emit(true);
            }
            else if (this.isScrollReachesRightEnd()) {
                // reached right end
                this.reachesLeftBound.emit(false);
                this.reachesRightBound.emit(true);
            }
            else if (this._contentRef.nativeElement.scrollLeft === 0 &&
                this._contentRef.nativeElement.scrollWidth >
                    this._contentRef.nativeElement.clientWidth) {
                // reached left end
                this.reachesLeftBound.emit(true);
                this.reachesRightBound.emit(false);
            }
            else {
                // in the middle
                this.reachesLeftBound.emit(false);
                this.reachesRightBound.emit(false);
            }
        }, 0);
    }
    onWheel(event) {
        if (this._xWheelEnabled) {
            event.preventDefault();
            if (this._snapDisabled) {
                this._contentRef.nativeElement.scrollBy(event.deltaY, 0);
            }
            else {
                if (event.deltaY < 0) {
                    this.moveLeft();
                }
                else if (event.deltaY > 0) {
                    this.moveRight();
                }
            }
        }
    }
    onWindowResize() {
        this.refreshWrapperDimensions();
        this.checkNavStatus();
    }
    _setIsDragging(value) {
        if (this._isDragging === value) {
            return;
        }
        this._isDragging = value;
        value ? this.dragStart.emit() : this.dragEnd.emit();
    }
    _startGlobalListening(isTouchEvent) {
        if (!this._onMouseMoveListener) {
            const eventName = isTouchEvent ? 'touchmove' : 'mousemove';
            this._onMouseMoveListener = this._renderer.listen('document', eventName, this.onMouseMoveHandler.bind(this));
        }
        if (!this._onMouseUpListener) {
            const eventName = isTouchEvent ? 'touchend' : 'mouseup';
            this._onMouseUpListener = this._renderer.listen('document', eventName, this.onMouseUpHandler.bind(this));
        }
    }
    _stopGlobalListening() {
        if (this._onMouseMoveListener) {
            this._onMouseMoveListener = this._onMouseMoveListener();
        }
        if (this._onMouseUpListener) {
            this._onMouseUpListener = this._onMouseUpListener();
        }
    }
    disableScroll(axis) {
        this._renderer.setStyle(this._contentRef.nativeElement, `overflow-${axis}`, 'hidden');
    }
    enableScroll(axis) {
        this._renderer.setStyle(this._contentRef.nativeElement, `overflow-${axis}`, 'auto');
    }
    hideScrollbar() {
        if (this._contentRef.nativeElement.style.display !== 'none' &&
            !this.wrapper) {
            this.parentNode = this._contentRef.nativeElement.parentNode;
            // create container element
            this.wrapper = this._renderer.createElement('div');
            this._renderer.setAttribute(this.wrapper, 'class', 'drag-scroll-wrapper');
            this._renderer.addClass(this.wrapper, 'drag-scroll-container');
            this.refreshWrapperDimensions();
            this._renderer.setStyle(this.wrapper, 'overflow', 'hidden');
            this._renderer.setStyle(this._contentRef.nativeElement, 'width', `calc(100% + ${this.scrollbarWidth})`);
            this._renderer.setStyle(this._contentRef.nativeElement, 'height', `calc(100% + ${this.scrollbarWidth})`);
            // Append container element to component element.
            this._renderer.appendChild(this._elementRef.nativeElement, this.wrapper);
            // Append content element to container element.
            this._renderer.appendChild(this.wrapper, this._contentRef.nativeElement);
            this.adjustMarginToLastChild();
        }
    }
    showScrollbar() {
        if (this.wrapper) {
            this._renderer.setStyle(this._contentRef.nativeElement, 'width', '100%');
            this._renderer.setStyle(this._contentRef.nativeElement, 'height', this.wrapper.style.height);
            if (this.parentNode !== null) {
                this.parentNode.removeChild(this.wrapper);
                this.parentNode.appendChild(this._contentRef.nativeElement);
            }
            this.wrapper = null;
            this.adjustMarginToLastChild();
        }
    }
    checkScrollbar() {
        if (this._contentRef.nativeElement.scrollWidth <=
            this._contentRef.nativeElement.clientWidth) {
            this._renderer.setStyle(this._contentRef.nativeElement, 'height', '100%');
        }
        else {
            this._renderer.setStyle(this._contentRef.nativeElement, 'height', `calc(100% + ${this.scrollbarWidth})`);
        }
        if (this._contentRef.nativeElement.scrollHeight <=
            this._contentRef.nativeElement.clientHeight) {
            this._renderer.setStyle(this._contentRef.nativeElement, 'width', '100%');
        }
        else {
            this._renderer.setStyle(this._contentRef.nativeElement, 'width', `calc(100% + ${this.scrollbarWidth})`);
        }
    }
    setScrollBar() {
        if (this.scrollbarHidden) {
            this.hideScrollbar();
        }
        else {
            this.showScrollbar();
        }
    }
    getScrollbarWidth() {
        /**
         * Browser Scrollbar Widths (2016)
         * OSX (Chrome, Safari, Firefox) - 15px
         * Windows XP (IE7, Chrome, Firefox) - 17px
         * Windows 7 (IE10, IE11, Chrome, Firefox) - 17px
         * Windows 8.1 (IE11, Chrome, Firefox) - 17px
         * Windows 10 (IE11, Chrome, Firefox) - 17px
         * Windows 10 (Edge 12/13) - 12px
         */
        const outer = this._renderer.createElement('div');
        this._renderer.setStyle(outer, 'visibility', 'hidden');
        this._renderer.setStyle(outer, 'width', '100px');
        this._renderer.setStyle(outer, 'msOverflowStyle', 'scrollbar'); // needed for WinJS apps
        // document.body.appendChild(outer);
        this._renderer.appendChild(this._document.body, outer);
        // this._renderer.appendChild(this._renderer.selectRootElement('body'), outer);
        const widthNoScroll = outer.offsetWidth;
        // force scrollbars
        this._renderer.setStyle(outer, 'overflow', 'scroll');
        // add innerdiv
        const inner = this._renderer.createElement('div');
        this._renderer.setStyle(inner, 'width', '100%');
        this._renderer.appendChild(outer, inner);
        const widthWithScroll = inner.offsetWidth;
        // remove divs
        this._renderer.removeChild(this._document.body, outer);
        /**
         * Scrollbar width will be 0 on Mac OS with the
         * default "Only show scrollbars when scrolling" setting (Yosemite and up).
         * setting default width to 20;
         */
        return widthNoScroll - widthWithScroll || 20;
    }
    refreshWrapperDimensions() {
        if (this.wrapper) {
            this._renderer.setStyle(this.wrapper, 'width', '100%');
            if (this._elementRef.nativeElement.style.height > 0 ||
                this._elementRef.nativeElement.offsetHeight > 0) {
                this._renderer.setStyle(this.wrapper, 'height', this._elementRef.nativeElement.style.height ||
                    this._elementRef.nativeElement.offsetHeight + 'px');
            }
            else {
                this._renderer.setStyle(this.wrapper, 'height', '100%');
            }
        }
    }
    /*
     * The below solution is heavily inspired from
     * https://gist.github.com/andjosh/6764939
     */
    scrollTo(element, to, duration) {
        const self = this;
        self.isAnimating = true;
        const rtlFactor = this.rtl ? -1 : 1;
        const start = element.scrollLeft, change = rtlFactor * to - start - this.snapOffset, increment = 20;
        let currentTime = 0;
        // t = current time
        // b = start value
        // c = change in value
        // d = duration
        const easeInOutQuad = function (t, b, c, d) {
            t /= d / 2;
            if (t < 1) {
                return (c / 2) * t * t + b;
            }
            t--;
            return (-c / 2) * (t * (t - 2) - 1) + b;
        };
        const animateScroll = function () {
            currentTime += increment;
            element.scrollLeft = easeInOutQuad(currentTime, start, change, duration);
            if (currentTime < duration) {
                self.scrollToTimer = setTimeout(animateScroll, increment);
            }
            else {
                // run one more frame to make sure the animation is fully finished
                setTimeout(() => {
                    self.isAnimating = false;
                    self.snapAnimationFinished.emit(self.currIndex);
                }, increment);
            }
        };
        animateScroll();
    }
    locateCurrentIndex(snap) {
        const scrollLeft = Math.abs(this._contentRef.nativeElement.scrollLeft);
        this.currentChildWidth((currentChildWidth, nextChildrenWidth, childrenWidth, idx, stop) => {
            if (scrollLeft >= childrenWidth && scrollLeft <= nextChildrenWidth) {
                if (nextChildrenWidth - scrollLeft > currentChildWidth / 2 &&
                    !this.isScrollReachesRightEnd()) {
                    // roll back scrolling
                    if (!this.isAnimating) {
                        this.currIndex = idx;
                    }
                    if (snap) {
                        this.scrollTo(this._contentRef.nativeElement, childrenWidth, this.snapDuration);
                    }
                }
                else if (scrollLeft !== 0) {
                    // forward scrolling
                    if (!this.isAnimating) {
                        this.currIndex = idx + 1;
                    }
                    if (snap) {
                        this.scrollTo(this._contentRef.nativeElement, childrenWidth + currentChildWidth, this.snapDuration);
                    }
                }
                stop();
            }
            else if (idx + 1 === this._children.length - 1) {
                // reaches last index
                if (!this.isAnimating) {
                    this.currIndex = idx + 1;
                }
                stop();
            }
        });
    }
    currentChildWidth(cb) {
        let childrenWidth = 0;
        let shouldBreak = false;
        const breakFunc = function () {
            shouldBreak = true;
        };
        const childrenArr = this._children.toArray();
        for (let i = 0; i < childrenArr.length; i++) {
            if (i === childrenArr.length - 1) {
                break;
            }
            if (shouldBreak) {
                break;
            }
            const nextChildrenWidth = childrenWidth +
                childrenArr[i + 1]._elementRef.nativeElement.clientWidth;
            const currentClildWidth = childrenArr[i]._elementRef.nativeElement.clientWidth;
            cb(currentClildWidth, nextChildrenWidth, childrenWidth, i, breakFunc);
            childrenWidth += currentClildWidth;
        }
    }
    toChildrenLocation() {
        let to = 0;
        const childrenArr = this._children.toArray();
        for (let i = 0; i < this.currIndex; i++) {
            to += childrenArr[i]._elementRef.nativeElement.clientWidth;
        }
        return to;
    }
    locateDragScrollItem(element) {
        let item = null;
        const childrenArr = this._children.toArray();
        for (let i = 0; i < childrenArr.length; i++) {
            if (element === childrenArr[i]._elementRef.nativeElement) {
                item = childrenArr[i];
            }
        }
        return item;
    }
    markElDimension() {
        if (this.wrapper) {
            this.elWidth = this.wrapper.style.width;
            this.elHeight = this.wrapper.style.height;
        }
        else {
            this.elWidth =
                this._elementRef.nativeElement.style.width ||
                    this._elementRef.nativeElement.offsetWidth + 'px';
            this.elHeight =
                this._elementRef.nativeElement.style.height ||
                    this._elementRef.nativeElement.offsetHeight + 'px';
        }
        const container = this.wrapper || this.parentNode;
        const containerWidth = container ? container.clientWidth : 0;
        if (this._children.length > 1) {
            this.indexBound = this.maximumIndex(containerWidth, this._children.toArray());
        }
    }
    maximumIndex(containerWidth, childrenElements) {
        let count = 0;
        let childrenWidth = 0;
        for (let i = 0; i <= childrenElements.length; i++) {
            // last N element
            const dragScrollItemDirective = childrenElements[childrenElements.length - 1 - i];
            if (!dragScrollItemDirective) {
                break;
            }
            else {
                const nativeElement = dragScrollItemDirective._elementRef.nativeElement;
                let itemWidth = nativeElement.clientWidth;
                if (itemWidth === 0 && nativeElement.firstElementChild) {
                    itemWidth =
                        dragScrollItemDirective._elementRef.nativeElement.firstElementChild
                            .clientWidth;
                }
                childrenWidth += itemWidth;
                if (childrenWidth < containerWidth) {
                    count++;
                }
                else {
                    break;
                }
            }
        }
        return childrenElements.length - count;
    }
    isScrollReachesRightEnd() {
        const scrollLeftPos = Math.abs(this._contentRef.nativeElement.scrollLeft) +
            this._contentRef.nativeElement.offsetWidth;
        return scrollLeftPos >= this._contentRef.nativeElement.scrollWidth;
    }
    /**
     * adds a margin right style to the last child element which will resolve the issue
     * of last item gets cutoff.
     */
    adjustMarginToLastChild() {
        if (this._children && this._children.length > 0 && this.hideScrollbar) {
            const childrenArr = this._children.toArray();
            const lastItem = childrenArr[childrenArr.length - 1]._elementRef.nativeElement;
            if (this.wrapper && childrenArr.length > 1) {
                this._renderer.setStyle(lastItem, 'margin-right', this.scrollbarWidth);
            }
            else {
                this._renderer.setStyle(lastItem, 'margin-right', 0);
            }
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: DragScrollComponent, deps: [{ token: ElementRef }, { token: Renderer2 }, { token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "16.0.0", type: DragScrollComponent, selector: "drag-scroll", inputs: { scrollbarHidden: ["scrollbar-hidden", "scrollbarHidden"], disabled: ["drag-scroll-disabled", "disabled"], xDisabled: ["drag-scroll-x-disabled", "xDisabled"], yDisabled: ["drag-scroll-y-disabled", "yDisabled"], xWheelEnabled: ["scroll-x-wheel-enabled", "xWheelEnabled"], dragDisabled: ["drag-disabled", "dragDisabled"], snapDisabled: ["snap-disabled", "snapDisabled"], snapOffset: ["snap-offset", "snapOffset"], snapDuration: ["snap-duration", "snapDuration"] }, outputs: { dsInitialized: "dsInitialized", indexChanged: "indexChanged", reachesLeftBound: "reachesLeftBound", reachesRightBound: "reachesRightBound", snapAnimationFinished: "snapAnimationFinished", dragStart: "dragStart", dragEnd: "dragEnd" }, host: { listeners: { "wheel": "onWheel($event)", "window:resize": "onWindowResize()" }, properties: { "style.pointer-events": "this._pointerEvents" } }, queries: [{ propertyName: "_children", predicate: DragScrollItemDirective, descendants: true }], viewQueries: [{ propertyName: "_contentRef", first: true, predicate: ["contentRef"], descendants: true, static: true }], usesOnChanges: true, ngImport: i0, template: `
    <div class="drag-scroll-content" #contentRef>
      <ng-content></ng-content>
    </div>
  `, isInline: true, styles: [":host{overflow:hidden;display:block}.drag-scroll-content{height:100%;overflow:auto;white-space:nowrap}\n"] }); }
}
export { DragScrollComponent };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: DragScrollComponent, decorators: [{
            type: Component,
            args: [{ selector: 'drag-scroll', template: `
    <div class="drag-scroll-content" #contentRef>
      <ng-content></ng-content>
    </div>
  `, styles: [":host{overflow:hidden;display:block}.drag-scroll-content{height:100%;overflow:auto;white-space:nowrap}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef, decorators: [{
                    type: Inject,
                    args: [ElementRef]
                }] }, { type: i0.Renderer2, decorators: [{
                    type: Inject,
                    args: [Renderer2]
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }]; }, propDecorators: { _contentRef: [{
                type: ViewChild,
                args: ['contentRef', { static: true }]
            }], _children: [{
                type: ContentChildren,
                args: [DragScrollItemDirective, { descendants: true }]
            }], _pointerEvents: [{
                type: HostBinding,
                args: ['style.pointer-events']
            }], dsInitialized: [{
                type: Output
            }], indexChanged: [{
                type: Output
            }], reachesLeftBound: [{
                type: Output
            }], reachesRightBound: [{
                type: Output
            }], snapAnimationFinished: [{
                type: Output
            }], dragStart: [{
                type: Output
            }], dragEnd: [{
                type: Output
            }], scrollbarHidden: [{
                type: Input,
                args: ['scrollbar-hidden']
            }], disabled: [{
                type: Input,
                args: ['drag-scroll-disabled']
            }], xDisabled: [{
                type: Input,
                args: ['drag-scroll-x-disabled']
            }], yDisabled: [{
                type: Input,
                args: ['drag-scroll-y-disabled']
            }], xWheelEnabled: [{
                type: Input,
                args: ['scroll-x-wheel-enabled']
            }], dragDisabled: [{
                type: Input,
                args: ['drag-disabled']
            }], snapDisabled: [{
                type: Input,
                args: ['snap-disabled']
            }], snapOffset: [{
                type: Input,
                args: ['snap-offset']
            }], snapDuration: [{
                type: Input,
                args: ['snap-duration']
            }], onWheel: [{
                type: HostListener,
                args: ['wheel', ['$event']]
            }], onWindowResize: [{
                type: HostListener,
                args: ['window:resize']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LWRyYWctc2Nyb2xsLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1kcmFnLXNjcm9sbC9zcmMvbGliL25neC1kcmFnLXNjcm9sbC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLFVBQVUsRUFDVixTQUFTLEVBQ1QsU0FBUyxFQUVULEtBQUssRUFDTCxNQUFNLEVBR04sWUFBWSxFQUNaLFNBQVMsRUFDVCxlQUFlLEVBRWYsU0FBUyxFQUNULE1BQU0sRUFDTixXQUFXLEVBQ1gsWUFBWSxFQUNiLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUUzQyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQzs7QUFFakUsTUFxQmEsbUJBQW1CO0lBaUQ5Qjs7T0FFRztJQUNILElBQUksVUFBVTtRQUNaLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUMxQixDQUFDO0lBc0NELElBQUksU0FBUztRQUNYLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0lBQ0QsSUFBSSxTQUFTLENBQUMsS0FBSztRQUNqQixJQUFJLEtBQUssS0FBSyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3pCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQy9CO0lBQ0gsQ0FBQztJQXdCRDs7T0FFRztJQUNILElBQ0ksZUFBZTtRQUNqQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztJQUMvQixDQUFDO0lBQ0QsSUFBSSxlQUFlLENBQUMsS0FBYztRQUNoQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7T0FFRztJQUNILElBQ0ksUUFB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QURwQixZQUFZO3VCQUFDLGVBQWUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBFbGVtZW50UmVmLFxuICBDb21wb25lbnQsXG4gIFJlbmRlcmVyMixcbiAgT25EZXN0cm95LFxuICBJbnB1dCxcbiAgT3V0cHV0LFxuICBBZnRlclZpZXdJbml0LFxuICBPbkNoYW5nZXMsXG4gIEV2ZW50RW1pdHRlcixcbiAgVmlld0NoaWxkLFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIEFmdGVyVmlld0NoZWNrZWQsXG4gIFF1ZXJ5TGlzdCxcbiAgSW5qZWN0LFxuICBIb3N0QmluZGluZyxcbiAgSG9zdExpc3RlbmVyXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgRE9DVU1FTlQgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuXG5pbXBvcnQgeyBEcmFnU2Nyb2xsSXRlbURpcmVjdGl2ZSB9IGZyb20gJy4vbmd4LWRyYWctc2Nyb2xsLWl0ZW0nO1xuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdkcmFnLXNjcm9sbCcsXG4gIHRlbXBsYXRlOiBgXG4gICAgPGRpdiBjbGFzcz1cImRyYWctc2Nyb2xsLWNvbnRlbnRcIiAjY29udGVudFJlZj5cbiAgICAgIDxuZy1jb250ZW50PjwvbmctY29udGVudD5cbiAgICA8L2Rpdj5cbiAgYCxcbiAgc3R5bGVzOiBbXG4gICAgYFxuICAgICAgOmhvc3Qge1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgIH1cbiAgICAgIC5kcmFnLXNjcm9sbC1jb250ZW50IHtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICBvdmVyZmxvdzogYXV0bztcbiAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgIH1cbiAgICBgXG4gIF1cbn0pXG5leHBvcnQgY2xhc3MgRHJhZ1Njcm9sbENvbXBvbmVudFxuICBpbXBsZW1lbnRzIE9uRGVzdHJveSwgQWZ0ZXJWaWV3SW5pdCwgT25DaGFuZ2VzLCBBZnRlclZpZXdDaGVja2VkXG57XG4gIHByaXZhdGUgX2luZGV4ID0gMDtcblxuICBwcml2YXRlIF9zY3JvbGxiYXJIaWRkZW4gPSBmYWxzZTtcblxuICBwcml2YXRlIF9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX3hEaXNhYmxlZCA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX3hXaGVlbEVuYWJsZWQgPSBmYWxzZTtcblxuICBwcml2YXRlIF95RGlzYWJsZWQgPSBmYWxzZTtcblxuICBwcml2YXRlIF9kcmFnRGlzYWJsZWQgPSBmYWxzZTtcblxuICBwcml2YXRlIF9zbmFwRGlzYWJsZWQgPSBmYWxzZTtcblxuICBwcml2YXRlIF9zbmFwT2Zmc2V0ID0gMDtcblxuICBwcml2YXRlIF9zbmFwRHVyYXRpb24gPSA1MDA7XG5cbiAgcHJpdmF0ZSBfaXNEcmFnZ2luZyA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX29uTW91c2VNb3ZlTGlzdGVuZXI6IEZ1bmN0aW9uO1xuXG4gIHByaXZhdGUgX29uTW91c2VVcExpc3RlbmVyOiBGdW5jdGlvbjtcblxuICBwcml2YXRlIF9vbk1vdXNlRG93bkxpc3RlbmVyOiBGdW5jdGlvbjtcblxuICBwcml2YXRlIF9vblNjcm9sbExpc3RlbmVyOiBGdW5jdGlvbjtcblxuICBwcml2YXRlIF9vbkRyYWdTdGFydExpc3RlbmVyOiBGdW5jdGlvbjtcblxuICAvKipcbiAgICogSXMgdGhlIHVzZXIgY3VycmVudGx5IHByZXNzaW5nIHRoZSBlbGVtZW50XG4gICAqL1xuICBpc1ByZXNzZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogSXMgdGhlIHVzZXIgY3VycmVudGx5IHNjcm9sbGluZyB0aGUgZWxlbWVudFxuICAgKi9cbiAgaXNTY3JvbGxpbmcgPSBmYWxzZTtcblxuICBzY3JvbGxUaW1lcjogbnVtYmVyIHwgTm9kZUpTLlRpbWVyID0gLTE7XG5cbiAgc2Nyb2xsVG9UaW1lcjogbnVtYmVyIHwgTm9kZUpTLlRpbWVyID0gLTE7XG5cbiAgLyoqXG4gICAqIElzIHRoZSB1c2VyIGN1cnJlbnRseSBkcmFnZ2luZyB0aGUgZWxlbWVudFxuICAgKi9cbiAgZ2V0IGlzRHJhZ2dpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzRHJhZ2dpbmc7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHggY29vcmRpbmF0ZXMgb24gdGhlIGVsZW1lbnRcbiAgICovXG4gIGRvd25YID0gMDtcblxuICAvKipcbiAgICogVGhlIHkgY29vcmRpbmF0ZXMgb24gdGhlIGVsZW1lbnRcbiAgICovXG4gIGRvd25ZID0gMDtcblxuICBkaXNwbGF5VHlwZTogc3RyaW5nIHwgbnVsbCA9ICdibG9jayc7XG5cbiAgZWxXaWR0aDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgZWxIZWlnaHQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgcGFyZW50Tm9kZSBvZiBjYXJvdXNlbCBFbGVtZW50XG4gICAqL1xuICBwYXJlbnROb2RlOiBIVE1MRWxlbWVudDtcblxuICAvKipcbiAgICogVGhlIGNhcm91c2VsIEVsZW1lbnRcbiAgICovXG5cbiAgQFZpZXdDaGlsZCgnY29udGVudFJlZicsIHsgc3RhdGljOiB0cnVlIH0pIF9jb250ZW50UmVmOiBFbGVtZW50UmVmO1xuXG4gIEBDb250ZW50Q2hpbGRyZW4oRHJhZ1Njcm9sbEl0ZW1EaXJlY3RpdmUsIHsgZGVzY2VuZGFudHM6IHRydWUgfSlcbiAgX2NoaWxkcmVuOiBRdWVyeUxpc3Q8RHJhZ1Njcm9sbEl0ZW1EaXJlY3RpdmU+O1xuXG4gIEBIb3N0QmluZGluZygnc3R5bGUucG9pbnRlci1ldmVudHMnKSBfcG9pbnRlckV2ZW50cyA9ICdhdXRvJztcblxuICB3cmFwcGVyOiBIVE1MRGl2RWxlbWVudCB8IG51bGw7XG5cbiAgc2Nyb2xsYmFyV2lkdGg6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gIGdldCBjdXJySW5kZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2luZGV4O1xuICB9XG4gIHNldCBjdXJySW5kZXgodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgIT09IHRoaXMuX2luZGV4KSB7XG4gICAgICB0aGlzLl9pbmRleCA9IHZhbHVlO1xuICAgICAgdGhpcy5pbmRleENoYW5nZWQuZW1pdCh2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgaXNBbmltYXRpbmcgPSBmYWxzZTtcblxuICBwcmV2Q2hpbGRyZW5MZW5ndGggPSAwO1xuXG4gIGluZGV4Qm91bmQgPSAwO1xuXG4gIHJ0bCA9IGZhbHNlO1xuXG4gIEBPdXRwdXQoKSBkc0luaXRpYWxpemVkID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuXG4gIEBPdXRwdXQoKSBpbmRleENoYW5nZWQgPSBuZXcgRXZlbnRFbWl0dGVyPG51bWJlcj4oKTtcblxuICBAT3V0cHV0KCkgcmVhY2hlc0xlZnRCb3VuZCA9IG5ldyBFdmVudEVtaXR0ZXI8Ym9vbGVhbj4oKTtcblxuICBAT3V0cHV0KCkgcmVhY2hlc1JpZ2h0Qm91bmQgPSBuZXcgRXZlbnRFbWl0dGVyPGJvb2xlYW4+KCk7XG5cbiAgQE91dHB1dCgpIHNuYXBBbmltYXRpb25GaW5pc2hlZCA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPigpO1xuXG4gIEBPdXRwdXQoKSBkcmFnU3RhcnQgPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgQE91dHB1dCgpIGRyYWdFbmQgPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHNjcm9sbGJhciBpcyBoaWRkZW5cbiAgICovXG4gIEBJbnB1dCgnc2Nyb2xsYmFyLWhpZGRlbicpXG4gIGdldCBzY3JvbGxiYXJIaWRkZW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Njcm9sbGJhckhpZGRlbjtcbiAgfVxuICBzZXQgc2Nyb2xsYmFySGlkZGVuKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fc2Nyb2xsYmFySGlkZGVuID0gdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciBob3Jpem9udGFsbHkgYW5kIHZlcnRpY2FsbHkgZHJhZ2luZyBhbmQgc2Nyb2xsaW5nIGlzIGJlIGRpc2FibGVkXG4gICAqL1xuICBASW5wdXQoJ2RyYWctc2Nyb2xsLWRpc2FibGVkJylcbiAgZ2V0IGRpc2FibGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9kaXNhYmxlZDtcbiAgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9kaXNhYmxlZCA9IHZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgaG9yaXpvbnRhbGx5IGRyYWdnaW5nIGFuZCBzY3JvbGxpbmcgaXMgYmUgZGlzYWJsZWRcbiAgICovXG4gIEBJbnB1dCgnZHJhZy1zY3JvbGwteC1kaXNhYmxlZCcpXG4gIGdldCB4RGlzYWJsZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3hEaXNhYmxlZDtcbiAgfVxuICBzZXQgeERpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5feERpc2FibGVkID0gdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB2ZXJ0aWNhbGx5IGRyYWdnaW5nIGFuZCBzY3JvbGxpbmcgZXZlbnRzIGlzIGRpc2FibGVkXG4gICAqL1xuICBASW5wdXQoJ2RyYWctc2Nyb2xsLXktZGlzYWJsZWQnKVxuICBnZXQgeURpc2FibGVkKCkge1xuICAgIHJldHVybiB0aGlzLl95RGlzYWJsZWQ7XG4gIH1cbiAgc2V0IHlEaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX3lEaXNhYmxlZCA9IHZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgc2Nyb2xsaW5nIGhvcml6b250YWxseSB3aXRoIG1vdXNlIHdoZWVsIGlzIGVuYWJsZWRcbiAgICovXG4gIEBJbnB1dCgnc2Nyb2xsLXgtd2hlZWwtZW5hYmxlZCcpXG4gIGdldCB4V2hlZWxFbmFibGVkKCkge1xuICAgIHJldHVybiB0aGlzLl94V2hlZWxFbmFibGVkO1xuICB9XG4gIHNldCB4V2hlZWxFbmFibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5feFdoZWVsRW5hYmxlZCA9IHZhbHVlO1xuICB9XG5cbiAgQElucHV0KCdkcmFnLWRpc2FibGVkJylcbiAgZ2V0IGRyYWdEaXNhYmxlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZHJhZ0Rpc2FibGVkO1xuICB9XG4gIHNldCBkcmFnRGlzYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9kcmFnRGlzYWJsZWQgPSB2YWx1ZTtcbiAgfVxuXG4gIEBJbnB1dCgnc25hcC1kaXNhYmxlZCcpXG4gIGdldCBzbmFwRGlzYWJsZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NuYXBEaXNhYmxlZDtcbiAgfVxuICBzZXQgc25hcERpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fc25hcERpc2FibGVkID0gdmFsdWU7XG4gIH1cblxuICBASW5wdXQoJ3NuYXAtb2Zmc2V0JylcbiAgZ2V0IHNuYXBPZmZzZXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NuYXBPZmZzZXQ7XG4gIH1cbiAgc2V0IHNuYXBPZmZzZXQodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX3NuYXBPZmZzZXQgPSB2YWx1ZTtcbiAgfVxuXG4gIEBJbnB1dCgnc25hcC1kdXJhdGlvbicpXG4gIGdldCBzbmFwRHVyYXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NuYXBEdXJhdGlvbjtcbiAgfVxuICBzZXQgc25hcER1cmF0aW9uKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9zbmFwRHVyYXRpb24gPSB2YWx1ZTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoRWxlbWVudFJlZikgcHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgICBASW5qZWN0KFJlbmRlcmVyMikgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyMixcbiAgICBASW5qZWN0KERPQ1VNRU5UKSBwcml2YXRlIF9kb2N1bWVudDogYW55XG4gICkge1xuICAgIHRoaXMuc2Nyb2xsYmFyV2lkdGggPSBgJHt0aGlzLmdldFNjcm9sbGJhcldpZHRoKCl9cHhgO1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoKSB7XG4gICAgdGhpcy5zZXRTY3JvbGxCYXIoKTtcblxuICAgIGlmICh0aGlzLnhEaXNhYmxlZCB8fCB0aGlzLmRpc2FibGVkIHx8IHRoaXMuX3Njcm9sbGJhckhpZGRlbikge1xuICAgICAgdGhpcy5kaXNhYmxlU2Nyb2xsKCd4Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZW5hYmxlU2Nyb2xsKCd4Jyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMueURpc2FibGVkIHx8IHRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuZGlzYWJsZVNjcm9sbCgneScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVuYWJsZVNjcm9sbCgneScpO1xuICAgIH1cbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICAvLyBhdXRvIGFzc2lnbiBjb21wdXRlZCBjc3NcbiAgICB0aGlzLl9yZW5kZXJlci5zZXRBdHRyaWJ1dGUoXG4gICAgICB0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAnZHJhZy1zY3JvbGwnLFxuICAgICAgJ3RydWUnXG4gICAgKTtcblxuICAgIHRoaXMuZGlzcGxheVR5cGUgPSAnYmxvY2snO1xuICAgICAgLy8gdHlwZW9mIHdpbmRvdz8uZ2V0Q29tcHV0ZWRTdHlsZSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgIC8vICAgPyB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpPy5kaXNwbGF5XG4gICAgICAvLyAgIDogJ2Jsb2NrJztcblxuICAgIHRoaXMuX3JlbmRlcmVyLnNldFN0eWxlKFxuICAgICAgdGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LFxuICAgICAgJ2Rpc3BsYXknLFxuICAgICAgdGhpcy5kaXNwbGF5VHlwZVxuICAgICk7XG4gICAgdGhpcy5fcmVuZGVyZXIuc2V0U3R5bGUoXG4gICAgICB0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAnd2hpdGVTcGFjZScsXG4gICAgICAnbm9XcmFwJ1xuICAgICk7XG5cbiAgICAvLyBzdG9yZSBlbGUgd2lkdGggaGVpZ2h0IGZvciBsYXRlciB1c2VyXG4gICAgdGhpcy5tYXJrRWxEaW1lbnNpb24oKTtcblxuICAgIHRoaXMuX3JlbmRlcmVyLnNldFN0eWxlKFxuICAgICAgdGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LFxuICAgICAgJ3dpZHRoJyxcbiAgICAgIHRoaXMuZWxXaWR0aFxuICAgICk7XG4gICAgdGhpcy5fcmVuZGVyZXIuc2V0U3R5bGUoXG4gICAgICB0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAnaGVpZ2h0JyxcbiAgICAgIHRoaXMuZWxIZWlnaHRcbiAgICApO1xuXG4gICAgaWYgKHRoaXMud3JhcHBlcikge1xuICAgICAgdGhpcy5jaGVja1Njcm9sbGJhcigpO1xuICAgIH1cblxuICAgIHRoaXMuX29uTW91c2VEb3duTGlzdGVuZXIgPSB0aGlzLl9yZW5kZXJlci5saXN0ZW4oXG4gICAgICB0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAnbW91c2Vkb3duJyxcbiAgICAgIHRoaXMub25Nb3VzZURvd25IYW5kbGVyLmJpbmQodGhpcylcbiAgICApO1xuICAgIHRoaXMuX29uU2Nyb2xsTGlzdGVuZXIgPSB0aGlzLl9yZW5kZXJlci5saXN0ZW4oXG4gICAgICB0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAnc2Nyb2xsJyxcbiAgICAgIHRoaXMub25TY3JvbGxIYW5kbGVyLmJpbmQodGhpcylcbiAgICApO1xuICAgIC8vIHByZXZlbnQgRmlyZWZveCBmcm9tIGRyYWdnaW5nIGltYWdlc1xuICAgIHRoaXMuX29uRHJhZ1N0YXJ0TGlzdGVuZXIgPSB0aGlzLl9yZW5kZXJlci5saXN0ZW4oXG4gICAgICB0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAnZHJhZ3N0YXJ0JyxcbiAgICAgIChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2hlY2tOYXZTdGF0dXMoKTtcbiAgICB0aGlzLmRzSW5pdGlhbGl6ZWQuZW1pdCgpO1xuICAgIHRoaXMuYWRqdXN0TWFyZ2luVG9MYXN0Q2hpbGQoKTtcblxuICAgIGNvbnNvbGUubG9nKFwiVEVTVFwiKTtcbiAgICAvLyB0aGlzLnJ0bCA9ICh0eXBlb2Ygd2luZG93Py5nZXRDb21wdXRlZFN0eWxlICE9PSAndW5kZWZpbmVkJ1xuICAgIC8vICAgICA/IHdpbmRvdz8uZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpPy5nZXRQcm9wZXJ0eVZhbHVlKCdkaXJlY3Rpb24nKVxuICAgIC8vICAgICA6ICdydGwnXG4gICAgLy8gKSA9PT0gJ3J0bCc7XG4gIH1cblxuICBuZ0FmdGVyVmlld0NoZWNrZWQoKSB7XG4gICAgLy8gYXZvaWQgZXh0cmEgY2hlY2tzXG4gICAgaWYgKHRoaXMuX2NoaWxkcmVuLmxlbmd0aCAhPT0gdGhpcy5wcmV2Q2hpbGRyZW5MZW5ndGgpIHtcbiAgICAgIHRoaXMubWFya0VsRGltZW5zaW9uKCk7XG4gICAgICB0aGlzLmNoZWNrU2Nyb2xsYmFyKCk7XG4gICAgICB0aGlzLnByZXZDaGlsZHJlbkxlbmd0aCA9IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDtcbiAgICAgIHRoaXMuY2hlY2tOYXZTdGF0dXMoKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9yZW5kZXJlci5zZXRBdHRyaWJ1dGUoXG4gICAgICB0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAnZHJhZy1zY3JvbGwnLFxuICAgICAgJ2ZhbHNlJ1xuICAgICk7XG4gICAgaWYgKHRoaXMuX29uTW91c2VEb3duTGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuX29uTW91c2VEb3duTGlzdGVuZXIgPSB0aGlzLl9vbk1vdXNlRG93bkxpc3RlbmVyKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9vblNjcm9sbExpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9vblNjcm9sbExpc3RlbmVyID0gdGhpcy5fb25TY3JvbGxMaXN0ZW5lcigpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fb25EcmFnU3RhcnRMaXN0ZW5lcikge1xuICAgICAgdGhpcy5fb25EcmFnU3RhcnRMaXN0ZW5lciA9IHRoaXMuX29uRHJhZ1N0YXJ0TGlzdGVuZXIoKTtcbiAgICB9XG4gIH1cblxuICBvbk1vdXNlTW92ZUhhbmRsZXIoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICB0aGlzLm9uTW91c2VNb3ZlKGV2ZW50KTtcbiAgfVxuXG4gIG9uTW91c2VNb3ZlKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LmNsaWVudFggPT09IHRoaXMuZG93blggJiYgZXZlbnQuY2xpZW50WSA9PT0gdGhpcy5kb3duWSkge1xuICAgICAgLy8gSWdub3JlICdtb3VzZW1vdmVcIiBldmVudCB0cmlnZ2VyZWQgYXQgdGhlIHNhbWUgY29vcmRpbmF0ZXMgdGhhdCB0aGUgbGFzdCBtb3VzZWRvd24gZXZlbnQgKGNvbnNlcXVlbmNlIG9mIHdpbmRvdyByZXNpemUpXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLmlzUHJlc3NlZCAmJiAhdGhpcy5kaXNhYmxlZCkge1xuICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgcHJldmVudCBzY3JvbGwgc3R1Y2sgaWYgYnJvd3NlciBsb3N0IGZvY3VzXG4gICAgICAvLyBNb3VzZUV2ZW50LmJ1dHRvbnMgbm90IHN1cHBvcnQgYnkgU2FmYXJpXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWRlcHJlY2F0ZWRcbiAgICAgIGlmICghZXZlbnQuYnV0dG9ucyAmJiAhZXZlbnQud2hpY2gpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub25Nb3VzZVVwSGFuZGxlcihldmVudCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3BvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgICB0aGlzLl9zZXRJc0RyYWdnaW5nKHRydWUpO1xuXG4gICAgICAvLyBEcmFnIFhcbiAgICAgIGlmICghdGhpcy54RGlzYWJsZWQgJiYgIXRoaXMuZHJhZ0Rpc2FibGVkKSB7XG4gICAgICAgIGNvbnN0IGNsaWVudFggPSAoZXZlbnQgYXMgTW91c2VFdmVudCkuY2xpZW50WDtcbiAgICAgICAgdGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LnNjcm9sbExlZnQgPVxuICAgICAgICAgIHRoaXMuX2NvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5zY3JvbGxMZWZ0IC0gY2xpZW50WCArIHRoaXMuZG93blg7XG4gICAgICAgIHRoaXMuZG93blggPSBjbGllbnRYO1xuICAgICAgfVxuXG4gICAgICAvLyBEcmFnIFlcbiAgICAgIGlmICghdGhpcy55RGlzYWJsZWQgJiYgIXRoaXMuZHJhZ0Rpc2FibGVkKSB7XG4gICAgICAgIGNvbnN0IGNsaWVudFkgPSAoZXZlbnQgYXMgTW91c2VFdmVudCkuY2xpZW50WTtcbiAgICAgICAgdGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LnNjcm9sbFRvcCA9XG4gICAgICAgICAgdGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LnNjcm9sbFRvcCAtIGNsaWVudFkgKyB0aGlzLmRvd25ZO1xuICAgICAgICB0aGlzLmRvd25ZID0gY2xpZW50WTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBvbk1vdXNlRG93bkhhbmRsZXIoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICBjb25zdCBkcmFnU2Nyb2xsSXRlbTogRHJhZ1Njcm9sbEl0ZW1EaXJlY3RpdmUgfCBudWxsID1cbiAgICAgIHRoaXMubG9jYXRlRHJhZ1Njcm9sbEl0ZW0oZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQpO1xuICAgIGlmIChkcmFnU2Nyb2xsSXRlbSAmJiBkcmFnU2Nyb2xsSXRlbS5kcmFnRGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc1RvdWNoRXZlbnQgPSBldmVudC50eXBlID09PSAndG91Y2hzdGFydCc7XG5cbiAgICB0aGlzLl9zdGFydEdsb2JhbExpc3RlbmluZyhpc1RvdWNoRXZlbnQpO1xuICAgIHRoaXMuaXNQcmVzc2VkID0gdHJ1ZTtcblxuICAgIGNvbnN0IG1vdXNlRXZlbnQgPSBldmVudCBhcyBNb3VzZUV2ZW50O1xuICAgIHRoaXMuZG93blggPSBtb3VzZUV2ZW50LmNsaWVudFg7XG4gICAgdGhpcy5kb3duWSA9IG1vdXNlRXZlbnQuY2xpZW50WTtcblxuICAgIGNsZWFyVGltZW91dCh0aGlzLnNjcm9sbFRvVGltZXIgYXMgbnVtYmVyKTtcbiAgfVxuXG4gIG9uU2Nyb2xsSGFuZGxlcigpIHtcbiAgICB0aGlzLmNoZWNrTmF2U3RhdHVzKCk7XG4gICAgaWYgKCF0aGlzLmlzUHJlc3NlZCAmJiAhdGhpcy5pc0FuaW1hdGluZyAmJiAhdGhpcy5zbmFwRGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuaXNTY3JvbGxpbmcgPSB0cnVlO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuc2Nyb2xsVGltZXIgYXMgbnVtYmVyKTtcbiAgICAgIHRoaXMuc2Nyb2xsVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5pc1Njcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxvY2F0ZUN1cnJlbnRJbmRleCh0cnVlKTtcbiAgICAgIH0sIDUwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubG9jYXRlQ3VycmVudEluZGV4KCk7XG4gICAgfVxuICB9XG5cbiAgb25Nb3VzZVVwSGFuZGxlcihldmVudDogTW91c2VFdmVudCkge1xuICAgIGlmICh0aGlzLmlzUHJlc3NlZCkge1xuICAgICAgdGhpcy5pc1ByZXNzZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuX3BvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICB0aGlzLl9zZXRJc0RyYWdnaW5nKGZhbHNlKTtcbiAgICAgIGlmICghdGhpcy5zbmFwRGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5sb2NhdGVDdXJyZW50SW5kZXgodHJ1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxvY2F0ZUN1cnJlbnRJbmRleCgpO1xuICAgICAgfVxuICAgICAgdGhpcy5fc3RvcEdsb2JhbExpc3RlbmluZygpO1xuICAgIH1cbiAgfVxuXG4gIC8qXG4gICAqIE5hdiBidXR0b25cbiAgICovXG4gIG1vdmVMZWZ0KCkge1xuICAgIGlmICh0aGlzLmN1cnJJbmRleCAhPT0gMCB8fCB0aGlzLnNuYXBEaXNhYmxlZCkge1xuICAgICAgdGhpcy5jdXJySW5kZXgtLTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnNjcm9sbFRvVGltZXIgYXMgbnVtYmVyKTtcbiAgICAgIHRoaXMuc2Nyb2xsVG8oXG4gICAgICAgIHRoaXMuX2NvbnRlbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgdGhpcy50b0NoaWxkcmVuTG9jYXRpb24oKSxcbiAgICAgICAgdGhpcy5zbmFwRHVyYXRpb25cbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgbW92ZVJpZ2h0KCkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMud3JhcHBlciB8fCB0aGlzLnBhcmVudE5vZGU7XG4gICAgY29uc3QgY29udGFpbmVyV2lkdGggPSBjb250YWluZXIgPyBjb250YWluZXIuY2xpZW50V2lkdGggOiAwO1xuXG4gICAgaWYgKFxuICAgICAgIXRoaXMuaXNTY3JvbGxSZWFjaGVzUmlnaHRFbmQoKSAmJlxuICAgICAgdGhpcy5jdXJySW5kZXggPFxuICAgICAgICB0aGlzLm1heGltdW1JbmRleChjb250YWluZXJXaWR0aCwgdGhpcy5fY2hpbGRyZW4udG9BcnJheSgpKVxuICAgICkge1xuICAgICAgdGhpcy5jdXJySW5kZXgrKztcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnNjcm9sbFRvVGltZXIgYXMgbnVtYmVyKTtcbiAgICAgIHRoaXMuc2Nyb2xsVG8oXG4gICAgICAgIHRoaXMuX2NvbnRlbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgdGhpcy50b0NoaWxkcmVuTG9jYXRpb24oKSxcbiAgICAgICAgdGhpcy5zbmFwRHVyYXRpb25cbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgbW92ZVRvKGluZGV4OiBudW1iZXIpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLndyYXBwZXIgfHwgdGhpcy5wYXJlbnROb2RlO1xuICAgIGNvbnN0IGNvbnRhaW5lcldpZHRoID0gY29udGFpbmVyID8gY29udGFpbmVyLmNsaWVudFdpZHRoIDogMDtcbiAgICBpZiAoXG4gICAgICBpbmRleCA+PSAwICYmXG4gICAgICBpbmRleCAhPT0gdGhpcy5jdXJySW5kZXggJiZcbiAgICAgIHRoaXMuY3VyckluZGV4IDw9XG4gICAgICAgIHRoaXMubWF4aW11bUluZGV4KGNvbnRhaW5lcldpZHRoLCB0aGlzLl9jaGlsZHJlbi50b0FycmF5KCkpXG4gICAgKSB7XG4gICAgICB0aGlzLmN1cnJJbmRleCA9IE1hdGgubWluKFxuICAgICAgICBpbmRleCxcbiAgICAgICAgdGhpcy5tYXhpbXVtSW5kZXgoY29udGFpbmVyV2lkdGgsIHRoaXMuX2NoaWxkcmVuLnRvQXJyYXkoKSlcbiAgICAgICk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5zY3JvbGxUb1RpbWVyIGFzIG51bWJlcik7XG4gICAgICB0aGlzLnNjcm9sbFRvKFxuICAgICAgICB0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAgIHRoaXMudG9DaGlsZHJlbkxvY2F0aW9uKCksXG4gICAgICAgIHRoaXMuc25hcER1cmF0aW9uXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGNoZWNrTmF2U3RhdHVzKCkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29uc3Qgb25seU9uZUl0ZW0gPSBCb29sZWFuKHRoaXMuX2NoaWxkcmVuLmxlbmd0aCA8PSAxKTtcbiAgICAgIGNvbnN0IGNvbnRhaW5lcklzTGFyZ2VyVGhhbkNvbnRlbnQgPSBCb29sZWFuKFxuICAgICAgICB0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQuc2Nyb2xsV2lkdGggPD1cbiAgICAgICAgICB0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xpZW50V2lkdGhcbiAgICAgICk7XG4gICAgICBpZiAob25seU9uZUl0ZW0gfHwgY29udGFpbmVySXNMYXJnZXJUaGFuQ29udGVudCkge1xuICAgICAgICAvLyBvbmx5IG9uZSBlbGVtZW50XG4gICAgICAgIHRoaXMucmVhY2hlc0xlZnRCb3VuZC5lbWl0KHRydWUpO1xuICAgICAgICB0aGlzLnJlYWNoZXNSaWdodEJvdW5kLmVtaXQodHJ1ZSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaXNTY3JvbGxSZWFjaGVzUmlnaHRFbmQoKSkge1xuICAgICAgICAvLyByZWFjaGVkIHJpZ2h0IGVuZFxuICAgICAgICB0aGlzLnJlYWNoZXNMZWZ0Qm91bmQuZW1pdChmYWxzZSk7XG4gICAgICAgIHRoaXMucmVhY2hlc1JpZ2h0Qm91bmQuZW1pdCh0cnVlKTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIHRoaXMuX2NvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5zY3JvbGxMZWZ0ID09PSAwICYmXG4gICAgICAgIHRoaXMuX2NvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5zY3JvbGxXaWR0aCA+XG4gICAgICAgICAgdGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LmNsaWVudFdpZHRoXG4gICAgICApIHtcbiAgICAgICAgLy8gcmVhY2hlZCBsZWZ0IGVuZFxuICAgICAgICB0aGlzLnJlYWNoZXNMZWZ0Qm91bmQuZW1pdCh0cnVlKTtcbiAgICAgICAgdGhpcy5yZWFjaGVzUmlnaHRCb3VuZC5lbWl0KGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGluIHRoZSBtaWRkbGVcbiAgICAgICAgdGhpcy5yZWFjaGVzTGVmdEJvdW5kLmVtaXQoZmFsc2UpO1xuICAgICAgICB0aGlzLnJlYWNoZXNSaWdodEJvdW5kLmVtaXQoZmFsc2UpO1xuICAgICAgfVxuICAgIH0sIDApO1xuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignd2hlZWwnLCBbJyRldmVudCddKVxuICBwdWJsaWMgb25XaGVlbChldmVudDogV2hlZWxFdmVudCkge1xuICAgIGlmICh0aGlzLl94V2hlZWxFbmFibGVkKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICBpZiAodGhpcy5fc25hcERpc2FibGVkKSB7XG4gICAgICAgIHRoaXMuX2NvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5zY3JvbGxCeShldmVudC5kZWx0YVksIDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGV2ZW50LmRlbHRhWSA8IDApIHtcbiAgICAgICAgICB0aGlzLm1vdmVMZWZ0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuZGVsdGFZID4gMCkge1xuICAgICAgICAgIHRoaXMubW92ZVJpZ2h0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBASG9zdExpc3RlbmVyKCd3aW5kb3c6cmVzaXplJylcbiAgcHVibGljIG9uV2luZG93UmVzaXplKCkge1xuICAgIHRoaXMucmVmcmVzaFdyYXBwZXJEaW1lbnNpb25zKCk7XG4gICAgdGhpcy5jaGVja05hdlN0YXR1cygpO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2V0SXNEcmFnZ2luZyh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLl9pc0RyYWdnaW5nID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2lzRHJhZ2dpbmcgPSB2YWx1ZTtcbiAgICB2YWx1ZSA/IHRoaXMuZHJhZ1N0YXJ0LmVtaXQoKSA6IHRoaXMuZHJhZ0VuZC5lbWl0KCk7XG4gIH1cblxuICBwcml2YXRlIF9zdGFydEdsb2JhbExpc3RlbmluZyhpc1RvdWNoRXZlbnQ6IGJvb2xlYW4pIHtcbiAgICBpZiAoIXRoaXMuX29uTW91c2VNb3ZlTGlzdGVuZXIpIHtcbiAgICAgIGNvbnN0IGV2ZW50TmFtZSA9IGlzVG91Y2hFdmVudCA/ICd0b3VjaG1vdmUnIDogJ21vdXNlbW92ZSc7XG4gICAgICB0aGlzLl9vbk1vdXNlTW92ZUxpc3RlbmVyID0gdGhpcy5fcmVuZGVyZXIubGlzdGVuKFxuICAgICAgICAnZG9jdW1lbnQnLFxuICAgICAgICBldmVudE5hbWUsXG4gICAgICAgIHRoaXMub25Nb3VzZU1vdmVIYW5kbGVyLmJpbmQodGhpcylcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9vbk1vdXNlVXBMaXN0ZW5lcikge1xuICAgICAgY29uc3QgZXZlbnROYW1lID0gaXNUb3VjaEV2ZW50ID8gJ3RvdWNoZW5kJyA6ICdtb3VzZXVwJztcbiAgICAgIHRoaXMuX29uTW91c2VVcExpc3RlbmVyID0gdGhpcy5fcmVuZGVyZXIubGlzdGVuKFxuICAgICAgICAnZG9jdW1lbnQnLFxuICAgICAgICBldmVudE5hbWUsXG4gICAgICAgIHRoaXMub25Nb3VzZVVwSGFuZGxlci5iaW5kKHRoaXMpXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3N0b3BHbG9iYWxMaXN0ZW5pbmcoKSB7XG4gICAgaWYgKHRoaXMuX29uTW91c2VNb3ZlTGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuX29uTW91c2VNb3ZlTGlzdGVuZXIgPSB0aGlzLl9vbk1vdXNlTW92ZUxpc3RlbmVyKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX29uTW91c2VVcExpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9vbk1vdXNlVXBMaXN0ZW5lciA9IHRoaXMuX29uTW91c2VVcExpc3RlbmVyKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBkaXNhYmxlU2Nyb2xsKGF4aXM6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuX3JlbmRlcmVyLnNldFN0eWxlKFxuICAgICAgdGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LFxuICAgICAgYG92ZXJmbG93LSR7YXhpc31gLFxuICAgICAgJ2hpZGRlbidcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBlbmFibGVTY3JvbGwoYXhpczogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5fcmVuZGVyZXIuc2V0U3R5bGUoXG4gICAgICB0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICBgb3ZlcmZsb3ctJHtheGlzfWAsXG4gICAgICAnYXV0bydcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBoaWRlU2Nyb2xsYmFyKCk6IHZvaWQge1xuICAgIGlmIChcbiAgICAgIHRoaXMuX2NvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5zdHlsZS5kaXNwbGF5ICE9PSAnbm9uZScgJiZcbiAgICAgICF0aGlzLndyYXBwZXJcbiAgICApIHtcbiAgICAgIHRoaXMucGFyZW50Tm9kZSA9IHRoaXMuX2NvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5wYXJlbnROb2RlO1xuXG4gICAgICAvLyBjcmVhdGUgY29udGFpbmVyIGVsZW1lbnRcbiAgICAgIHRoaXMud3JhcHBlciA9IHRoaXMuX3JlbmRlcmVyLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgdGhpcy5fcmVuZGVyZXIuc2V0QXR0cmlidXRlKHRoaXMud3JhcHBlciwgJ2NsYXNzJywgJ2RyYWctc2Nyb2xsLXdyYXBwZXInKTtcbiAgICAgIHRoaXMuX3JlbmRlcmVyLmFkZENsYXNzKHRoaXMud3JhcHBlciwgJ2RyYWctc2Nyb2xsLWNvbnRhaW5lcicpO1xuXG4gICAgICB0aGlzLnJlZnJlc2hXcmFwcGVyRGltZW5zaW9ucygpO1xuXG4gICAgICB0aGlzLl9yZW5kZXJlci5zZXRTdHlsZSh0aGlzLndyYXBwZXIsICdvdmVyZmxvdycsICdoaWRkZW4nKTtcblxuICAgICAgdGhpcy5fcmVuZGVyZXIuc2V0U3R5bGUoXG4gICAgICAgIHRoaXMuX2NvbnRlbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgJ3dpZHRoJyxcbiAgICAgICAgYGNhbGMoMTAwJSArICR7dGhpcy5zY3JvbGxiYXJXaWR0aH0pYFxuICAgICAgKTtcbiAgICAgIHRoaXMuX3JlbmRlcmVyLnNldFN0eWxlKFxuICAgICAgICB0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAgICdoZWlnaHQnLFxuICAgICAgICBgY2FsYygxMDAlICsgJHt0aGlzLnNjcm9sbGJhcldpZHRofSlgXG4gICAgICApO1xuXG4gICAgICAvLyBBcHBlbmQgY29udGFpbmVyIGVsZW1lbnQgdG8gY29tcG9uZW50IGVsZW1lbnQuXG4gICAgICB0aGlzLl9yZW5kZXJlci5hcHBlbmRDaGlsZCh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsIHRoaXMud3JhcHBlcik7XG5cbiAgICAgIC8vIEFwcGVuZCBjb250ZW50IGVsZW1lbnQgdG8gY29udGFpbmVyIGVsZW1lbnQuXG4gICAgICB0aGlzLl9yZW5kZXJlci5hcHBlbmRDaGlsZCh0aGlzLndyYXBwZXIsIHRoaXMuX2NvbnRlbnRSZWYubmF0aXZlRWxlbWVudCk7XG5cbiAgICAgIHRoaXMuYWRqdXN0TWFyZ2luVG9MYXN0Q2hpbGQoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNob3dTY3JvbGxiYXIoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMud3JhcHBlcikge1xuICAgICAgdGhpcy5fcmVuZGVyZXIuc2V0U3R5bGUodGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LCAnd2lkdGgnLCAnMTAwJScpO1xuICAgICAgdGhpcy5fcmVuZGVyZXIuc2V0U3R5bGUoXG4gICAgICAgIHRoaXMuX2NvbnRlbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgJ2hlaWdodCcsXG4gICAgICAgIHRoaXMud3JhcHBlci5zdHlsZS5oZWlnaHRcbiAgICAgICk7XG4gICAgICBpZiAodGhpcy5wYXJlbnROb2RlICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLndyYXBwZXIpO1xuICAgICAgICB0aGlzLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHRoaXMud3JhcHBlciA9IG51bGw7XG5cbiAgICAgIHRoaXMuYWRqdXN0TWFyZ2luVG9MYXN0Q2hpbGQoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNoZWNrU2Nyb2xsYmFyKCkge1xuICAgIGlmIChcbiAgICAgIHRoaXMuX2NvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5zY3JvbGxXaWR0aCA8PVxuICAgICAgdGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LmNsaWVudFdpZHRoXG4gICAgKSB7XG4gICAgICB0aGlzLl9yZW5kZXJlci5zZXRTdHlsZSh0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQsICdoZWlnaHQnLCAnMTAwJScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9yZW5kZXJlci5zZXRTdHlsZShcbiAgICAgICAgdGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LFxuICAgICAgICAnaGVpZ2h0JyxcbiAgICAgICAgYGNhbGMoMTAwJSArICR7dGhpcy5zY3JvbGxiYXJXaWR0aH0pYFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgdGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LnNjcm9sbEhlaWdodCA8PVxuICAgICAgdGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LmNsaWVudEhlaWdodFxuICAgICkge1xuICAgICAgdGhpcy5fcmVuZGVyZXIuc2V0U3R5bGUodGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LCAnd2lkdGgnLCAnMTAwJScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9yZW5kZXJlci5zZXRTdHlsZShcbiAgICAgICAgdGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LFxuICAgICAgICAnd2lkdGgnLFxuICAgICAgICBgY2FsYygxMDAlICsgJHt0aGlzLnNjcm9sbGJhcldpZHRofSlgXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2V0U2Nyb2xsQmFyKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNjcm9sbGJhckhpZGRlbikge1xuICAgICAgdGhpcy5oaWRlU2Nyb2xsYmFyKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2hvd1Njcm9sbGJhcigpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0U2Nyb2xsYmFyV2lkdGgoKTogbnVtYmVyIHtcbiAgICAvKipcbiAgICAgKiBCcm93c2VyIFNjcm9sbGJhciBXaWR0aHMgKDIwMTYpXG4gICAgICogT1NYIChDaHJvbWUsIFNhZmFyaSwgRmlyZWZveCkgLSAxNXB4XG4gICAgICogV2luZG93cyBYUCAoSUU3LCBDaHJvbWUsIEZpcmVmb3gpIC0gMTdweFxuICAgICAqIFdpbmRvd3MgNyAoSUUxMCwgSUUxMSwgQ2hyb21lLCBGaXJlZm94KSAtIDE3cHhcbiAgICAgKiBXaW5kb3dzIDguMSAoSUUxMSwgQ2hyb21lLCBGaXJlZm94KSAtIDE3cHhcbiAgICAgKiBXaW5kb3dzIDEwIChJRTExLCBDaHJvbWUsIEZpcmVmb3gpIC0gMTdweFxuICAgICAqIFdpbmRvd3MgMTAgKEVkZ2UgMTIvMTMpIC0gMTJweFxuICAgICAqL1xuICAgIGNvbnN0IG91dGVyID0gdGhpcy5fcmVuZGVyZXIuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5fcmVuZGVyZXIuc2V0U3R5bGUob3V0ZXIsICd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xuICAgIHRoaXMuX3JlbmRlcmVyLnNldFN0eWxlKG91dGVyLCAnd2lkdGgnLCAnMTAwcHgnKTtcbiAgICB0aGlzLl9yZW5kZXJlci5zZXRTdHlsZShvdXRlciwgJ21zT3ZlcmZsb3dTdHlsZScsICdzY3JvbGxiYXInKTsgLy8gbmVlZGVkIGZvciBXaW5KUyBhcHBzXG4gICAgLy8gZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvdXRlcik7XG4gICAgdGhpcy5fcmVuZGVyZXIuYXBwZW5kQ2hpbGQodGhpcy5fZG9jdW1lbnQuYm9keSwgb3V0ZXIpO1xuICAgIC8vIHRoaXMuX3JlbmRlcmVyLmFwcGVuZENoaWxkKHRoaXMuX3JlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KCdib2R5JyksIG91dGVyKTtcbiAgICBjb25zdCB3aWR0aE5vU2Nyb2xsID0gb3V0ZXIub2Zmc2V0V2lkdGg7XG4gICAgLy8gZm9yY2Ugc2Nyb2xsYmFyc1xuICAgIHRoaXMuX3JlbmRlcmVyLnNldFN0eWxlKG91dGVyLCAnb3ZlcmZsb3cnLCAnc2Nyb2xsJyk7XG5cbiAgICAvLyBhZGQgaW5uZXJkaXZcbiAgICBjb25zdCBpbm5lciA9IHRoaXMuX3JlbmRlcmVyLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuX3JlbmRlcmVyLnNldFN0eWxlKGlubmVyLCAnd2lkdGgnLCAnMTAwJScpO1xuICAgIHRoaXMuX3JlbmRlcmVyLmFwcGVuZENoaWxkKG91dGVyLCBpbm5lcik7XG5cbiAgICBjb25zdCB3aWR0aFdpdGhTY3JvbGwgPSBpbm5lci5vZmZzZXRXaWR0aDtcblxuICAgIC8vIHJlbW92ZSBkaXZzXG4gICAgdGhpcy5fcmVuZGVyZXIucmVtb3ZlQ2hpbGQodGhpcy5fZG9jdW1lbnQuYm9keSwgb3V0ZXIpO1xuXG4gICAgLyoqXG4gICAgICogU2Nyb2xsYmFyIHdpZHRoIHdpbGwgYmUgMCBvbiBNYWMgT1Mgd2l0aCB0aGVcbiAgICAgKiBkZWZhdWx0IFwiT25seSBzaG93IHNjcm9sbGJhcnMgd2hlbiBzY3JvbGxpbmdcIiBzZXR0aW5nIChZb3NlbWl0ZSBhbmQgdXApLlxuICAgICAqIHNldHRpbmcgZGVmYXVsdCB3aWR0aCB0byAyMDtcbiAgICAgKi9cbiAgICByZXR1cm4gd2lkdGhOb1Njcm9sbCAtIHdpZHRoV2l0aFNjcm9sbCB8fCAyMDtcbiAgfVxuXG4gIHByaXZhdGUgcmVmcmVzaFdyYXBwZXJEaW1lbnNpb25zKCkge1xuICAgIGlmICh0aGlzLndyYXBwZXIpIHtcbiAgICAgIHRoaXMuX3JlbmRlcmVyLnNldFN0eWxlKHRoaXMud3JhcHBlciwgJ3dpZHRoJywgJzEwMCUnKTtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnN0eWxlLmhlaWdodCA+IDAgfHxcbiAgICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50Lm9mZnNldEhlaWdodCA+IDBcbiAgICAgICkge1xuICAgICAgICB0aGlzLl9yZW5kZXJlci5zZXRTdHlsZShcbiAgICAgICAgICB0aGlzLndyYXBwZXIsXG4gICAgICAgICAgJ2hlaWdodCcsXG4gICAgICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnN0eWxlLmhlaWdodCB8fFxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50Lm9mZnNldEhlaWdodCArICdweCdcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3JlbmRlcmVyLnNldFN0eWxlKHRoaXMud3JhcHBlciwgJ2hlaWdodCcsICcxMDAlJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLypcbiAgICogVGhlIGJlbG93IHNvbHV0aW9uIGlzIGhlYXZpbHkgaW5zcGlyZWQgZnJvbVxuICAgKiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9hbmRqb3NoLzY3NjQ5MzlcbiAgICovXG4gIHByaXZhdGUgc2Nyb2xsVG8oZWxlbWVudDogRWxlbWVudCwgdG86IG51bWJlciwgZHVyYXRpb246IG51bWJlcikge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIHNlbGYuaXNBbmltYXRpbmcgPSB0cnVlO1xuICAgIGNvbnN0IHJ0bEZhY3RvciA9IHRoaXMucnRsID8gLTEgOiAxO1xuICAgIGNvbnN0IHN0YXJ0ID0gZWxlbWVudC5zY3JvbGxMZWZ0LFxuICAgICAgY2hhbmdlID0gcnRsRmFjdG9yICogdG8gLSBzdGFydCAtIHRoaXMuc25hcE9mZnNldCxcbiAgICAgIGluY3JlbWVudCA9IDIwO1xuICAgIGxldCBjdXJyZW50VGltZSA9IDA7XG5cbiAgICAvLyB0ID0gY3VycmVudCB0aW1lXG4gICAgLy8gYiA9IHN0YXJ0IHZhbHVlXG4gICAgLy8gYyA9IGNoYW5nZSBpbiB2YWx1ZVxuICAgIC8vIGQgPSBkdXJhdGlvblxuICAgIGNvbnN0IGVhc2VJbk91dFF1YWQgPSBmdW5jdGlvbiAoXG4gICAgICB0OiBudW1iZXIsXG4gICAgICBiOiBudW1iZXIsXG4gICAgICBjOiBudW1iZXIsXG4gICAgICBkOiBudW1iZXJcbiAgICApIHtcbiAgICAgIHQgLz0gZCAvIDI7XG4gICAgICBpZiAodCA8IDEpIHtcbiAgICAgICAgcmV0dXJuIChjIC8gMikgKiB0ICogdCArIGI7XG4gICAgICB9XG4gICAgICB0LS07XG4gICAgICByZXR1cm4gKC1jIC8gMikgKiAodCAqICh0IC0gMikgLSAxKSArIGI7XG4gICAgfTtcblxuICAgIGNvbnN0IGFuaW1hdGVTY3JvbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjdXJyZW50VGltZSArPSBpbmNyZW1lbnQ7XG4gICAgICBlbGVtZW50LnNjcm9sbExlZnQgPSBlYXNlSW5PdXRRdWFkKGN1cnJlbnRUaW1lLCBzdGFydCwgY2hhbmdlLCBkdXJhdGlvbik7XG4gICAgICBpZiAoY3VycmVudFRpbWUgPCBkdXJhdGlvbikge1xuICAgICAgICBzZWxmLnNjcm9sbFRvVGltZXIgPSBzZXRUaW1lb3V0KGFuaW1hdGVTY3JvbGwsIGluY3JlbWVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBydW4gb25lIG1vcmUgZnJhbWUgdG8gbWFrZSBzdXJlIHRoZSBhbmltYXRpb24gaXMgZnVsbHkgZmluaXNoZWRcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgc2VsZi5pc0FuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgICAgIHNlbGYuc25hcEFuaW1hdGlvbkZpbmlzaGVkLmVtaXQoc2VsZi5jdXJySW5kZXgpO1xuICAgICAgICB9LCBpbmNyZW1lbnQpO1xuICAgICAgfVxuICAgIH07XG4gICAgYW5pbWF0ZVNjcm9sbCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2NhdGVDdXJyZW50SW5kZXgoc25hcD86IGJvb2xlYW4pIHtcbiAgICBjb25zdCBzY3JvbGxMZWZ0ID0gTWF0aC5hYnModGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LnNjcm9sbExlZnQpO1xuXG4gICAgdGhpcy5jdXJyZW50Q2hpbGRXaWR0aChcbiAgICAgIChcbiAgICAgICAgY3VycmVudENoaWxkV2lkdGgsXG4gICAgICAgIG5leHRDaGlsZHJlbldpZHRoLFxuICAgICAgICBjaGlsZHJlbldpZHRoLFxuICAgICAgICBpZHg6IG51bWJlcixcbiAgICAgICAgc3RvcFxuICAgICAgKSA9PiB7XG4gICAgICAgIGlmIChzY3JvbGxMZWZ0ID49IGNoaWxkcmVuV2lkdGggJiYgc2Nyb2xsTGVmdCA8PSBuZXh0Q2hpbGRyZW5XaWR0aCkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG5leHRDaGlsZHJlbldpZHRoIC0gc2Nyb2xsTGVmdCA+IGN1cnJlbnRDaGlsZFdpZHRoIC8gMiAmJlxuICAgICAgICAgICAgIXRoaXMuaXNTY3JvbGxSZWFjaGVzUmlnaHRFbmQoKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgLy8gcm9sbCBiYWNrIHNjcm9sbGluZ1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzQW5pbWF0aW5nKSB7XG4gICAgICAgICAgICAgIHRoaXMuY3VyckluZGV4ID0gaWR4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNuYXApIHtcbiAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyhcbiAgICAgICAgICAgICAgICB0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW5XaWR0aCxcbiAgICAgICAgICAgICAgICB0aGlzLnNuYXBEdXJhdGlvblxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoc2Nyb2xsTGVmdCAhPT0gMCkge1xuICAgICAgICAgICAgLy8gZm9yd2FyZCBzY3JvbGxpbmdcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0FuaW1hdGluZykge1xuICAgICAgICAgICAgICB0aGlzLmN1cnJJbmRleCA9IGlkeCArIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc25hcCkge1xuICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKFxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRlbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgICAgICAgICBjaGlsZHJlbldpZHRoICsgY3VycmVudENoaWxkV2lkdGgsXG4gICAgICAgICAgICAgICAgdGhpcy5zbmFwRHVyYXRpb25cbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgc3RvcCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGlkeCArIDEgPT09IHRoaXMuX2NoaWxkcmVuLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAvLyByZWFjaGVzIGxhc3QgaW5kZXhcbiAgICAgICAgICBpZiAoIXRoaXMuaXNBbmltYXRpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuY3VyckluZGV4ID0gaWR4ICsgMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RvcCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3VycmVudENoaWxkV2lkdGgoXG4gICAgY2I6IChcbiAgICAgIGN1cnJlbnRDbGlsZFdpZHRoOiBudW1iZXIsXG4gICAgICBuZXh0Q2hpbGRyZW5XaWR0aDogbnVtYmVyLFxuICAgICAgY2hpbGRyZW5XaWR0aDogbnVtYmVyLFxuICAgICAgaW5kZXg6IG51bWJlcixcbiAgICAgIGJyZWFrRnVuYzogKCkgPT4gdm9pZFxuICAgICkgPT4gdm9pZFxuICApIHtcbiAgICBsZXQgY2hpbGRyZW5XaWR0aCA9IDA7XG4gICAgbGV0IHNob3VsZEJyZWFrID0gZmFsc2U7XG4gICAgY29uc3QgYnJlYWtGdW5jID0gZnVuY3Rpb24gKCkge1xuICAgICAgc2hvdWxkQnJlYWsgPSB0cnVlO1xuICAgIH07XG4gICAgY29uc3QgY2hpbGRyZW5BcnIgPSB0aGlzLl9jaGlsZHJlbi50b0FycmF5KCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuQXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoaSA9PT0gY2hpbGRyZW5BcnIubGVuZ3RoIC0gMSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChzaG91bGRCcmVhaykge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmV4dENoaWxkcmVuV2lkdGggPVxuICAgICAgICBjaGlsZHJlbldpZHRoICtcbiAgICAgICAgY2hpbGRyZW5BcnJbaSArIDFdLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgICBjb25zdCBjdXJyZW50Q2xpbGRXaWR0aCA9XG4gICAgICAgIGNoaWxkcmVuQXJyW2ldLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgICBjYihjdXJyZW50Q2xpbGRXaWR0aCwgbmV4dENoaWxkcmVuV2lkdGgsIGNoaWxkcmVuV2lkdGgsIGksIGJyZWFrRnVuYyk7XG5cbiAgICAgIGNoaWxkcmVuV2lkdGggKz0gY3VycmVudENsaWxkV2lkdGg7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB0b0NoaWxkcmVuTG9jYXRpb24oKTogbnVtYmVyIHtcbiAgICBsZXQgdG8gPSAwO1xuICAgIGNvbnN0IGNoaWxkcmVuQXJyID0gdGhpcy5fY2hpbGRyZW4udG9BcnJheSgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jdXJySW5kZXg7IGkrKykge1xuICAgICAgdG8gKz0gY2hpbGRyZW5BcnJbaV0uX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICB9XG4gICAgcmV0dXJuIHRvO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2NhdGVEcmFnU2Nyb2xsSXRlbShcbiAgICBlbGVtZW50OiBFbGVtZW50XG4gICk6IERyYWdTY3JvbGxJdGVtRGlyZWN0aXZlIHwgbnVsbCB7XG4gICAgbGV0IGl0ZW06IERyYWdTY3JvbGxJdGVtRGlyZWN0aXZlIHwgbnVsbCA9IG51bGw7XG4gICAgY29uc3QgY2hpbGRyZW5BcnIgPSB0aGlzLl9jaGlsZHJlbi50b0FycmF5KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbkFyci5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGVsZW1lbnQgPT09IGNoaWxkcmVuQXJyW2ldLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpIHtcbiAgICAgICAgaXRlbSA9IGNoaWxkcmVuQXJyW2ldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaXRlbTtcbiAgfVxuXG4gIHByaXZhdGUgbWFya0VsRGltZW5zaW9uKCkge1xuICAgIGlmICh0aGlzLndyYXBwZXIpIHtcbiAgICAgIHRoaXMuZWxXaWR0aCA9IHRoaXMud3JhcHBlci5zdHlsZS53aWR0aDtcbiAgICAgIHRoaXMuZWxIZWlnaHQgPSB0aGlzLndyYXBwZXIuc3R5bGUuaGVpZ2h0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsV2lkdGggPVxuICAgICAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuc3R5bGUud2lkdGggfHxcbiAgICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50Lm9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgIHRoaXMuZWxIZWlnaHQgPVxuICAgICAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuc3R5bGUuaGVpZ2h0IHx8XG4gICAgICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5vZmZzZXRIZWlnaHQgKyAncHgnO1xuICAgIH1cbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLndyYXBwZXIgfHwgdGhpcy5wYXJlbnROb2RlO1xuICAgIGNvbnN0IGNvbnRhaW5lcldpZHRoID0gY29udGFpbmVyID8gY29udGFpbmVyLmNsaWVudFdpZHRoIDogMDtcbiAgICBpZiAodGhpcy5fY2hpbGRyZW4ubGVuZ3RoID4gMSkge1xuICAgICAgdGhpcy5pbmRleEJvdW5kID0gdGhpcy5tYXhpbXVtSW5kZXgoXG4gICAgICAgIGNvbnRhaW5lcldpZHRoLFxuICAgICAgICB0aGlzLl9jaGlsZHJlbi50b0FycmF5KClcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBtYXhpbXVtSW5kZXgoXG4gICAgY29udGFpbmVyV2lkdGg6IG51bWJlcixcbiAgICBjaGlsZHJlbkVsZW1lbnRzOiBEcmFnU2Nyb2xsSXRlbURpcmVjdGl2ZVtdXG4gICk6IG51bWJlciB7XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICBsZXQgY2hpbGRyZW5XaWR0aCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gY2hpbGRyZW5FbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gbGFzdCBOIGVsZW1lbnRcbiAgICAgIGNvbnN0IGRyYWdTY3JvbGxJdGVtRGlyZWN0aXZlOiBEcmFnU2Nyb2xsSXRlbURpcmVjdGl2ZSA9XG4gICAgICAgIGNoaWxkcmVuRWxlbWVudHNbY2hpbGRyZW5FbGVtZW50cy5sZW5ndGggLSAxIC0gaV07XG4gICAgICBpZiAoIWRyYWdTY3JvbGxJdGVtRGlyZWN0aXZlKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGRyYWdTY3JvbGxJdGVtRGlyZWN0aXZlLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgICAgIGxldCBpdGVtV2lkdGggPSBuYXRpdmVFbGVtZW50LmNsaWVudFdpZHRoO1xuICAgICAgICBpZiAoaXRlbVdpZHRoID09PSAwICYmIG5hdGl2ZUVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQpIHtcbiAgICAgICAgICBpdGVtV2lkdGggPVxuICAgICAgICAgICAgZHJhZ1Njcm9sbEl0ZW1EaXJlY3RpdmUuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZFxuICAgICAgICAgICAgICAuY2xpZW50V2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGRyZW5XaWR0aCArPSBpdGVtV2lkdGg7XG4gICAgICAgIGlmIChjaGlsZHJlbldpZHRoIDwgY29udGFpbmVyV2lkdGgpIHtcbiAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbkVsZW1lbnRzLmxlbmd0aCAtIGNvdW50O1xuICB9XG5cbiAgcHJpdmF0ZSBpc1Njcm9sbFJlYWNoZXNSaWdodEVuZCgpOiBib29sZWFuIHtcbiAgICBjb25zdCBzY3JvbGxMZWZ0UG9zID1cbiAgICAgIE1hdGguYWJzKHRoaXMuX2NvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5zY3JvbGxMZWZ0KSArXG4gICAgICB0aGlzLl9jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQub2Zmc2V0V2lkdGg7XG4gICAgcmV0dXJuIHNjcm9sbExlZnRQb3MgPj0gdGhpcy5fY29udGVudFJlZi5uYXRpdmVFbGVtZW50LnNjcm9sbFdpZHRoO1xuICB9XG5cbiAgLyoqXG4gICAqIGFkZHMgYSBtYXJnaW4gcmlnaHQgc3R5bGUgdG8gdGhlIGxhc3QgY2hpbGQgZWxlbWVudCB3aGljaCB3aWxsIHJlc29sdmUgdGhlIGlzc3VlXG4gICAqIG9mIGxhc3QgaXRlbSBnZXRzIGN1dG9mZi5cbiAgICovXG4gIHByaXZhdGUgYWRqdXN0TWFyZ2luVG9MYXN0Q2hpbGQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2NoaWxkcmVuICYmIHRoaXMuX2NoaWxkcmVuLmxlbmd0aCA+IDAgJiYgdGhpcy5oaWRlU2Nyb2xsYmFyKSB7XG4gICAgICBjb25zdCBjaGlsZHJlbkFyciA9IHRoaXMuX2NoaWxkcmVuLnRvQXJyYXkoKTtcbiAgICAgIGNvbnN0IGxhc3RJdGVtID1cbiAgICAgICAgY2hpbGRyZW5BcnJbY2hpbGRyZW5BcnIubGVuZ3RoIC0gMV0uX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICAgIGlmICh0aGlzLndyYXBwZXIgJiYgY2hpbGRyZW5BcnIubGVuZ3RoID4gMSkge1xuICAgICAgICB0aGlzLl9yZW5kZXJlci5zZXRTdHlsZShsYXN0SXRlbSwgJ21hcmdpbi1yaWdodCcsIHRoaXMuc2Nyb2xsYmFyV2lkdGgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcmVuZGVyZXIuc2V0U3R5bGUobGFzdEl0ZW0sICdtYXJnaW4tcmlnaHQnLCAwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==