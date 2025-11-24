import { Injectable, Input } from "@angular/core";
import { ChevronDown, LinkIcon, LucideIconData, SquareArrowOutUpRight, Search, Minus, ChevronUp, Check } from "lucide-angular";

@Injectable({
    providedIn: 'root'
})
export class IconService {
    @Input() iconName!: string;

    public iconsMap: Record<string, LucideIconData> = {
        'link': LinkIcon,
        'chevronDown': ChevronDown,
        'chevronUp': ChevronUp,
        'squareArrowOutUpRight': SquareArrowOutUpRight,
        'search': Search,
        'minus': Minus,
        'check': Check
    };

    get icon() {
        return this.iconsMap[this.iconName];
    }
}