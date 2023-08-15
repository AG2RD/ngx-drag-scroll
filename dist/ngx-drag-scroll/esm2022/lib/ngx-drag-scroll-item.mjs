import { Directive, ElementRef, Input, HostBinding, Inject } from '@angular/core';
import * as i0 from "@angular/core";
class DragScrollItemDirective {
    get dragDisabled() {
        return this._dragDisabled;
    }
    set dragDisabled(value) {
        this._dragDisabled = value;
    }
    constructor(elementRef) {
        this.display = 'inline-block';
        this._dragDisabled = false;
        this._elementRef = elementRef;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: DragScrollItemDirective, deps: [{ token: ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: DragScrollItemDirective, selector: "[drag-scroll-item]", inputs: { dragDisabled: ["drag-disabled", "dragDisabled"] }, host: { properties: { "style.display": "this.display" } }, ngImport: i0 }); }
}
export { DragScrollItemDirective };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: DragScrollItemDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[drag-scroll-item]'
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef, decorators: [{
                    type: Inject,
                    args: [ElementRef]
                }] }]; }, propDecorators: { display: [{
                type: HostBinding,
                args: ['style.display']
            }], dragDisabled: [{
                type: Input,
                args: ['drag-disabled']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LWRyYWctc2Nyb2xsLWl0ZW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtZHJhZy1zY3JvbGwvc3JjL2xpYi9uZ3gtZHJhZy1zY3JvbGwtaXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixLQUFLLEVBQ0wsV0FBVyxFQUNYLE1BQU0sRUFDUCxNQUFNLGVBQWUsQ0FBQzs7QUFFdkIsTUFHYSx1QkFBdUI7SUFJbEMsSUFDSSxZQUFZO1FBQ2QsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO0lBQzVCLENBQUM7SUFDRCxJQUFJLFlBQVksQ0FBQyxLQUFjO1FBQzdCLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0lBQzdCLENBQUM7SUFNRCxZQUFnQyxVQUFzQjtRQWR0RCxZQUFPLEdBQUcsY0FBYyxDQUFDO1FBVXpCLGtCQUFhLEdBQUcsS0FBSyxDQUFDO1FBS3BCLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO0lBQ2hDLENBQUM7OEdBbEJVLHVCQUF1QixrQkFnQmQsVUFBVTtrR0FoQm5CLHVCQUF1Qjs7U0FBdkIsdUJBQXVCOzJGQUF2Qix1QkFBdUI7a0JBSG5DLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLG9CQUFvQjtpQkFDL0I7OzBCQWlCYyxNQUFNOzJCQUFDLFVBQVU7NENBZDlCLE9BQU87c0JBRE4sV0FBVzt1QkFBQyxlQUFlO2dCQUl4QixZQUFZO3NCQURmLEtBQUs7dUJBQUMsZUFBZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgSW5wdXQsXG4gIEhvc3RCaW5kaW5nLFxuICBJbmplY3Rcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tkcmFnLXNjcm9sbC1pdGVtXSdcbn0pXG5leHBvcnQgY2xhc3MgRHJhZ1Njcm9sbEl0ZW1EaXJlY3RpdmUge1xuICBASG9zdEJpbmRpbmcoJ3N0eWxlLmRpc3BsYXknKVxuICBkaXNwbGF5ID0gJ2lubGluZS1ibG9jayc7XG5cbiAgQElucHV0KCdkcmFnLWRpc2FibGVkJylcbiAgZ2V0IGRyYWdEaXNhYmxlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZHJhZ0Rpc2FibGVkO1xuICB9XG4gIHNldCBkcmFnRGlzYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9kcmFnRGlzYWJsZWQgPSB2YWx1ZTtcbiAgfVxuXG4gIF9kcmFnRGlzYWJsZWQgPSBmYWxzZTtcblxuICBfZWxlbWVudFJlZjogRWxlbWVudFJlZjtcblxuICBjb25zdHJ1Y3RvcihASW5qZWN0KEVsZW1lbnRSZWYpIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICB0aGlzLl9lbGVtZW50UmVmID0gZWxlbWVudFJlZjtcbiAgfVxufVxuIl19