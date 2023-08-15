/// <reference types="node" />
import { ElementRef, Renderer2, OnDestroy, AfterViewInit, OnChanges, EventEmitter, AfterViewChecked, QueryList } from '@angular/core';
import { DragScrollItemDirective } from './ngx-drag-scroll-item';
import * as i0 from "@angular/core";
export declare class DragScrollComponent implements OnDestroy, AfterViewInit, OnChanges, AfterViewChecked {
    private _elementRef;
    private _renderer;
    private _document;
    private _index;
    private _scrollbarHidden;
    private _disabled;
    private _xDisabled;
    private _xWheelEnabled;
    private _yDisabled;
    private _dragDisabled;
    private _snapDisabled;
    private _snapOffset;
    private _snapDuration;
    private _isDragging;
    private _onMouseMoveListener;
    private _onMouseUpListener;
    private _onMouseDownListener;
    private _onScrollListener;
    private _onDragStartListener;
    /**
     * Is the user currently pressing the element
     */
    isPressed: boolean;
    /**
     * Is the user currently scrolling the element
     */
    isScrolling: boolean;
    scrollTimer: number | NodeJS.Timer;
    scrollToTimer: number | NodeJS.Timer;
    /**
     * Is the user currently dragging the element
     */
    get isDragging(): boolean;
    /**
     * The x coordinates on the element
     */
    downX: number;
    /**
     * The y coordinates on the element
     */
    downY: number;
    displayType: string | null;
    elWidth: string | null;
    elHeight: string | null;
    /**
     * The parentNode of carousel Element
     */
    parentNode: HTMLElement;
    /**
     * The carousel Element
     */
    _contentRef: ElementRef;
    _children: QueryList<DragScrollItemDirective>;
    _pointerEvents: string;
    wrapper: HTMLDivElement | null;
    scrollbarWidth: string | null;
    get currIndex(): number;
    set currIndex(value: number);
    isAnimating: boolean;
    prevChildrenLength: number;
    indexBound: number;
    rtl: boolean;
    dsInitialized: EventEmitter<void>;
    indexChanged: EventEmitter<number>;
    reachesLeftBound: EventEmitter<boolean>;
    reachesRightBound: EventEmitter<boolean>;
    snapAnimationFinished: EventEmitter<number>;
    dragStart: EventEmitter<void>;
    dragEnd: EventEmitter<void>;
    /**
     * Whether the scrollbar is hidden
     */
    get scrollbarHidden(): boolean;
    set scrollbarHidden(value: boolean);
    /**
     * Whether horizontally and vertically draging and scrolling is be disabled
     */
    get disabled(): boolean;
    set disabled(value: boolean);
    /**
     * Whether horizontally dragging and scrolling is be disabled
     */
    get xDisabled(): boolean;
    set xDisabled(value: boolean);
    /**
     * Whether vertically dragging and scrolling events is disabled
     */
    get yDisabled(): boolean;
    set yDisabled(value: boolean);
    /**
     * Whether scrolling horizontally with mouse wheel is enabled
     */
    get xWheelEnabled(): boolean;
    set xWheelEnabled(value: boolean);
    get dragDisabled(): boolean;
    set dragDisabled(value: boolean);
    get snapDisabled(): boolean;
    set snapDisabled(value: boolean);
    get snapOffset(): number;
    set snapOffset(value: number);
    get snapDuration(): number;
    set snapDuration(value: number);
    constructor(_elementRef: ElementRef, _renderer: Renderer2, _document: any);
    ngOnChanges(): void;
    ngAfterViewInit(): void;
    ngAfterViewChecked(): void;
    ngOnDestroy(): void;
    onMouseMoveHandler(event: MouseEvent): void;
    onMouseMove(event: MouseEvent): void;
    onMouseDownHandler(event: MouseEvent): void;
    onScrollHandler(): void;
    onMouseUpHandler(event: MouseEvent): void;
    moveLeft(): void;
    moveRight(): void;
    moveTo(index: number): void;
    checkNavStatus(): void;
    onWheel(event: WheelEvent): void;
    onWindowResize(): void;
    private _setIsDragging;
    private _startGlobalListening;
    private _stopGlobalListening;
    private disableScroll;
    private enableScroll;
    private hideScrollbar;
    private showScrollbar;
    private checkScrollbar;
    private setScrollBar;
    private getScrollbarWidth;
    private refreshWrapperDimensions;
    private scrollTo;
    private locateCurrentIndex;
    private currentChildWidth;
    private toChildrenLocation;
    private locateDragScrollItem;
    private markElDimension;
    private maximumIndex;
    private isScrollReachesRightEnd;
    /**
     * adds a margin right style to the last child element which will resolve the issue
     * of last item gets cutoff.
     */
    private adjustMarginToLastChild;
    static ɵfac: i0.ɵɵFactoryDeclaration<DragScrollComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<DragScrollComponent, "drag-scroll", never, { "scrollbarHidden": { "alias": "scrollbar-hidden"; "required": false; }; "disabled": { "alias": "drag-scroll-disabled"; "required": false; }; "xDisabled": { "alias": "drag-scroll-x-disabled"; "required": false; }; "yDisabled": { "alias": "drag-scroll-y-disabled"; "required": false; }; "xWheelEnabled": { "alias": "scroll-x-wheel-enabled"; "required": false; }; "dragDisabled": { "alias": "drag-disabled"; "required": false; }; "snapDisabled": { "alias": "snap-disabled"; "required": false; }; "snapOffset": { "alias": "snap-offset"; "required": false; }; "snapDuration": { "alias": "snap-duration"; "required": false; }; }, { "dsInitialized": "dsInitialized"; "indexChanged": "indexChanged"; "reachesLeftBound": "reachesLeftBound"; "reachesRightBound": "reachesRightBound"; "snapAnimationFinished": "snapAnimationFinished"; "dragStart": "dragStart"; "dragEnd": "dragEnd"; }, ["_children"], ["*"], false, never>;
}
