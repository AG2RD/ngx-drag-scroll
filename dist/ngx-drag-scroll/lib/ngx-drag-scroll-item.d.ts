import { ElementRef } from '@angular/core';
import * as i0 from "@angular/core";
export declare class DragScrollItemDirective {
    display: string;
    get dragDisabled(): boolean;
    set dragDisabled(value: boolean);
    _dragDisabled: boolean;
    _elementRef: ElementRef;
    constructor(elementRef: ElementRef);
    static ɵfac: i0.ɵɵFactoryDeclaration<DragScrollItemDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<DragScrollItemDirective, "[drag-scroll-item]", never, { "dragDisabled": { "alias": "drag-disabled"; "required": false; }; }, {}, never, never, false, never>;
}
