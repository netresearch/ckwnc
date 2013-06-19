<?php
/*
 * Copyright (c) 2011, Daniel Walton (daniel@belteshazzar.com)
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the <organization> nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

header('HTTP/1.0 500 Internal server error');
header("Content-type: text/plain");


class DB
{
	// using localhost
	private $HOST = "127.0.0.1";
	private $USER = "ckwnc";
	private $PASS = 'password';
	private $NAME = "ckwnc";

	// using development database
	/*
	private $HOST = 'HOSTNAME';
	private $USER = 'ckwncdev';
	private $PASS = 'PASSWORD';
	private $NAME = 'ckwncdev';
	*/

	// using live database
	/*
	private $HOST = 'HOSTNAME';
	private $USER = 'ckwncdev';
	private $PASS = 'PASSWORD';
	private $NAME = 'ckwncdev';
	*/

	public function __construct()
	{
		mysql_connect($this->HOST,$this->USER,$this->PASS) or die("could not connect to db".mysql_error());
		mysql_select_db($this->NAME) or die("could not select db".mysql_error());
	}

	public function __destruct()
	{
		mysql_close() or die("couldn't close db connection".mysql_error());
	}

	private function query( $sql )
	{
		$result = mysql_query($sql);
		if ($result === false) {
            trigger_error('SQL error: ' . mysql_error(). " ||| " . $sql);
        }
		return $result;
	}

	public function insert( $sql )
	{
		$r = $this->query($sql);
		if ( $r ) return mysql_insert_id();
		return false;
	}

	public function select($sql)
	{
		$r = $this->query($sql);
		if ( !$r || mysql_num_rows($r)==0 ) return false;

		$result = array();
		while ( $temp = mysql_fetch_assoc($r) ) $result[] = $temp;

		return $result;
	}
}


	$db = new DB();

	if ( isset($_GET['id']) )
	{
		$result = $db->select("SELECT code FROM diagrams WHERE id='" . mysql_real_escape_string($_GET['id']) . "'");
		if ( count($result)==1 )
		{
			$result = array ('id' => $_GET['id'], 'code' => $result[0]['code'] );
			header('HTTP/1.0 200 OK');
			header('Content-type: application/json');
			echo json_encode($result);
		}
		exit;
	}
	if ( isset($_POST['code']) )
	{
		if (get_magic_quotes_gpc())
		{
			$_POST['code'] = stripslashes($_POST['code']);
	        }

		$id = $db->insert("INSERT INTO diagrams (code) VALUES ('" . mysql_real_escape_string( $_POST['code'] ) . "')");

		$result = array ('id' => $id );
                header('HTTP/1.0 201 Created');
                header('Content-type: application/json');
		echo json_encode($result);
		exit(0);
	}

?>