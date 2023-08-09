function applyMobileJs() {
	$(".menu-btn").on("click", function () {
		if ($(".nav-menus").css("display") == "flex") {
			console.log("flex");
			$(".nav-menus").css({ "display": "none" });
		} else {
			console.log("none");
			$(".nav-menus").css({ "display": "flex" });
		}
	})
}


function checkMobileView() {
	const mobileWidth = 1000;
	if ($(window).width() <= mobileWidth) {
		applyMobileJs();
	}else{
		$(".nav-menus").css({ "display": "flex" });
	}
}

$("document").ready(function () {
	$(".nav-menus").css({ "display": "flex" });
	checkMobileView();
	$(window).resize(checkMobileView);

})