import { Injectable, Input } from '@angular/core';
import {
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronsDown,
  ChevronUp,
  CopyIcon,
  Dices,
  EllipsisVertical,
  LinkIcon,
  LucideIconData,
  Minus,
  Plus,
  Search,
  Send,
  Settings,
  SquareArrowOutUpRight,
  User,
  X,
} from 'lucide-angular';

@Injectable({
  providedIn: 'root',
})
export class IconService {
  @Input() iconName!: string;

  public iconsMap: Record<string, LucideIconData> = {
    link: LinkIcon,
    chevronDown: ChevronDown,
    chevronUp: ChevronUp,
    chevronLeft: ChevronLeft,
    squareArrowOutUpRight: SquareArrowOutUpRight,
    search: Search,
    minus: Minus,
    check: Check,
    chevronsDown: ChevronsDown,
    send: Send,
    user: User,
    x: X,
    settings: Settings,
    'ellipsis-vertical': EllipsisVertical,
    copy: CopyIcon,
    calendar: CalendarIcon,
    dices: Dices,
    plus: Plus,
  };

  get icon() {
    return this.iconsMap[this.iconName];
  }
}
