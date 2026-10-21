import { Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SearchService } from '../../core/services/search.service';

@Component({
  selector: 'app-search',
  imports: [RouterLink],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  readonly searchService = inject(SearchService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // The shell owns the search input/debounce; this page only reacts to the resulting ?q= param
    // (also covers a direct link/refresh on /search?q=...).
    const subscription = this.route.queryParamMap.subscribe(
      (params) => void this.searchService.search(params.get('q') ?? ''),
    );
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
}
