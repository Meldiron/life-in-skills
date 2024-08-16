<script>
	import '../app.css';
    import { afterNavigate } from "$app/navigation";
  
    afterNavigate(() => {
        // @ts-ignore
      window.HSStaticMethods.autoInit();
    });

</script>

<slot />
