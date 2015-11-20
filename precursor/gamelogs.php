<?
/* ------------------------------------------------------------------------------------------ */
$action = (!empty($_GET['a']) ? $_GET['a'] : '');
if (empty($action)) {exit('error');}
#----------
if ($action == 'getID') {
	echo md5(uniqid('island20151116'.$_SERVER['REMOTE_ADDR'], true));

} elseif ($action == 'add') {
	$session = (!empty($_GET['s']) ? $_GET['s'] : '');
	if (empty($session)) {exit;}
	#----------
	$result = (!empty($_GET['r']) ? $_GET['r'] : '');
	if (empty($result)) {exit;}
	#----------
	$command = (!empty($_GET['c']) ? $_GET['c'] : '');
	if (empty($command)) {exit;}
	#----------
	$time = date('Y.m.d H:i:s');
	#----------
	$fname = './logs/'.md5('files'.$session);
	#----------
	if (!file_exists($fname.'.log')) {
		$file = fopen($fname.'.log', 'a');
		if ($file) {
			fwrite($file, 
				'IP:  '."\t\t".$_SERVER['REMOTE_ADDR']."\r\n".
				'DATA:'."\t\t".$_SERVER['HTTP_USER_AGENT']."\r\n".
				'TIME:'."\t\t".$time."\r\n".
				'--------------------------------------------------'."\r\n"
			);
		}
	} else {
		$file = fopen($fname.'.log', 'a');
	}
	if ($file) {
		fwrite($file, $time."\t".$result."\t".$command."\r\n");
		fclose($file);
	}
	#----------
	if ($result == 'f') {
		$file = fopen($fname.'.errors', 'a');
		if ($file) {
			fwrite($file, $command."\r\n");
			fclose($file);
		}
	}
	#----------
	exit('ok');
}
/* ------------------------------------------------------------------------------------------ */
?>