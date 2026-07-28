<?php

header('Content-Type: application/json');

echo(json_encode([
	'ecccfa187bfe31edaeda0c2e027e6fa1:477012' => [
		'version' => '{version}',
		'engine' => '{engine}',
		'timestamp' => {timestamp},
		'target' => '{target}',
	]
]));